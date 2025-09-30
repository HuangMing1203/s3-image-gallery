import React, { useState } from 'react';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Dialog
} from '@mui/material';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import LazyImage from './LazyImage';

function parseS3FileList(xml, inputUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const contents = doc.getElementsByTagName('Contents');

  // Get base URL without query or trailing slash
  const urlObj = new URL(inputUrl);
  const baseUrl = urlObj.origin + urlObj.pathname.replace(/\/$/, '');

  const images = [];
  for (let i = 0; i < contents.length; i++) {
    const key = contents[i].getElementsByTagName('Key')[0]?.textContent;
    const lastModified = contents[i].getElementsByTagName('LastModified')[0]?.textContent;
    if (key && /\.(jpe?g|png|gif|bmp|webp)$/i.test(key)) {
      // Join baseUrl and key (handle leading/trailing slash)
      const imgUrl = baseUrl.replace(/\/$/, '') + '/' + key.replace(/^\/+/, '');
      images.push({
        url: imgUrl,
        lastModified: lastModified ? new Date(lastModified) : new Date(0)
      });
    }
  }
  // Sort from newest to oldest
  images.sort((a, b) => b.lastModified - a.lastModified);
  return images;
}

export default function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgLoaded, setImgLoaded] = useState({});
  const [containerRatios, setContainerRatios] = useState({});
  const [previewImg, setPreviewImg] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setImages([]);
    try {
      const res = await axios.get(inputUrl, { responseType: 'text' });
      const imgs = parseS3FileList(res.data, inputUrl);
      if (imgs.length === 0) setError('No images found in the provided S3 list.');
      setImages(imgs);
    } catch (err) {
      setError('Failed to fetch or parse the S3 file list.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <PhotoLibraryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            S3 Image Gallery
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="row" gap={2} alignItems="center">
              <TextField
                label="S3 file list URL (XML)"
                variant="outlined"
                fullWidth
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                required
                size="small"
                autoFocus
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ minWidth: 48, px: 1, py: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? <CircularProgress size={24} /> : <PhotoLibraryIcon />}
              </Button>
            </Box>
          </form>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>
        {images.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 2,
            }}
          >
            {images.map((img, i) => {
              const ratio = containerRatios[img.url] || { width: 1, height: 1 };
              const aspect = ratio.height / ratio.width;
              return (
                <Box key={img.url}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      pt: `${aspect * 100}%`, // dynamic aspect ratio
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: '#eee',
                      transition: 'padding-top 0.3s'
                    }}
                  >
                    {!imgLoaded[img.url] && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CircularProgress size={32} />
                      </Box>
                    )}
                    <LazyImage
                      src={img.url}
                      alt={`img-${i}`}
                      onLoad={size => {
                        setImgLoaded(l => ({ ...l, [img.url]: true }));
                        if (size && size.width && size.height) {
                          setContainerRatios(r => ({ ...r, [img.url]: size }));
                        }
                      }}
                      onClick={() => setPreviewImg(img)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 8,
                        opacity: imgLoaded[img.url] ? 1 : 0,
                        transition: 'opacity 0.3s'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {img.lastModified.toLocaleString()}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ) : (
          !loading && !error && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              No images loaded yet.
            </Typography>
          )
        )}
        {/* Image preview dialog */}
        <Dialog
          open={!!previewImg}
          onClose={() => setPreviewImg(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { bgcolor: 'background.default', borderRadius: 0, boxShadow: 8, width: 'unset' } }}
        >
          <Box sx={{ position: 'relative', bgcolor: 'black', textAlign: 'center' }}>
            {previewImg && (
              <img
                src={previewImg.url}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  margin: 'auto',
                  display: 'block',
                  background: '#222'
                }}
              />
            )}
          </Box>
        </Dialog>
      </Container>
    </Box>
  );
}