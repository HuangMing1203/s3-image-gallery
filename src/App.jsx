import React, { useState } from 'react';
import axios from 'axios';

function parseS3FileList(xml, inputUrl) {
  const urls = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const contents = doc.getElementsByTagName('Contents');

  // Get base URL without query or trailing slash
  const urlObj = new URL(inputUrl);
  const baseUrl = urlObj.origin + urlObj.pathname.replace(/\/$/, '');

  for (let i = 0; i < contents.length; i++) {
    const key = contents[i].getElementsByTagName('Key')[0]?.textContent;
    if (key && /\.(jpe?g|png|gif|bmp|webp)$/i.test(key)) {
      // Join baseUrl and key (handle leading/trailing slash)
      const imgUrl = baseUrl.replace(/\/$/, '') + '/' + key.replace(/^\/+/, '');
      urls.push(imgUrl);
    }
  }
  return urls;
}

export default function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="app-container">
      <h1>S3 Image Gallery</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Paste your S3 file list URL (XML)"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Show Gallery'}
        </button>
      </form>
      {error && <div style={{color: 'red', marginTop: 16}}>{error}</div>}
      <div className="gallery">
        {images.map((src, i) => (
          <img src={src} alt={`img-${i}`} key={src} />
        ))}
      </div>
    </div>
  );
}
