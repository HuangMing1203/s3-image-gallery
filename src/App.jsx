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
  ImageList,
  ImageListItem,
  useMediaQuery,
  Paper
} from '@mui/material';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

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
  const isSmall = useMediaQuery('(max-width:600px)');
  const isMedium = useMediaQuery('(max-width:900px)');

  const cols = isSmall ? 2 : isMedium ? 3 : 4;

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
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
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
                sx={{ minWidth: 130 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Show Gallery'}
              </Button>
            </Box>
          </form>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>
        {images.length > 0 ? (
          <ImageList variant="masonry" cols={cols} gap={12}>
            {images.map((img, i) => (
              <ImageListItem key={img.url}>
                <img
                  src={img.url}
                  alt={`img-${i}`}
                  loading="lazy"
                  style={{ width: '100%', borderRadius: 8 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {img.lastModified.toLocaleString()}
                </Typography>
              </ImageListItem>
            ))}
          </ImageList>
        ) : (
          !loading && !error && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              No images loaded yet.
            </Typography>
          )
        )}
      </Container>
    </Box>
  );
}