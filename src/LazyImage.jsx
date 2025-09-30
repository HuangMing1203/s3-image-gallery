import React, { useState, useRef, useEffect } from 'react';

export default function LazyImage({ src, alt, onLoad, onClick, style }) {
  const [visible, setVisible] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const imgRef = useRef();

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLoad = e => {
    setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
    onLoad && onLoad(naturalSize);
  };

  useEffect(() => {
    if (naturalSize.width && naturalSize.height && onLoad) {
      onLoad(naturalSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naturalSize.width, naturalSize.height]);

  return (
    <div ref={imgRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      {visible && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={style}
          onLoad={handleLoad}
          onClick={onClick}
        />
      )}
    </div>
  );
}
