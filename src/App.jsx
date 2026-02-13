import { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import Fuse from 'fuse.js';
import { monsters } from './monsters';

// 1. IMPROVED FUSE CONFIG
const fuse = new Fuse(monsters, {
  keys: ['name', 'aliases'],
  includeScore: true,
  threshold: 0.5, // Slightly looser matching
  ignoreLocation: true, // Finds "Chatacabra" in "BFeral Chatacabra"
});

export default function App() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);

  // State
  const [status, setStatus] = useState('Idle');
  const [match, setMatch] = useState(null);
  const [debugText, setDebugText] = useState('');

  // Zoom State
  const [zoom, setZoom] = useState(1);
  const [zoomCap, setZoomCap] = useState({ min: 1, max: 3, step: 0.1 }); // Defaults
  const [track, setTrack] = useState(null);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 }, // Try to get high res for better OCR
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // --- ZOOM SETUP ---
        const videoTrack = stream.getVideoTracks()[0];
        setTrack(videoTrack);

        // Check if this camera supports zoom
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.zoom) {
          setZoomCap({
            min: capabilities.zoom.min,
            max: capabilities.zoom.max,
            step: capabilities.zoom.step,
          });
          // Default to slight zoom (1.5x) if available for comfort
          handleZoom(Math.min(capabilities.zoom.max, 1.5), videoTrack);
        }
      }
    } catch (err) {
      console.error('Camera Error:', err);
      setStatus('Camera Error: Check permissions');
    }
  };

  // Helper to apply zoom
  const handleZoom = (value, videoTrack = track) => {
    if (!videoTrack) return;
    setZoom(value);

    // Check purely for safety
    const capabilities = videoTrack.getCapabilities();
    if (capabilities.zoom) {
      videoTrack
        .applyConstraints({
          advanced: [{ zoom: value }],
        })
        .catch((e) => console.log('Zoom apply failed', e));
    }
  };

  const scanRegion = async () => {
    if (!videoRef.current || !overlayRef.current) return;
    setStatus('Scanning...');
    setMatch(null);

    const video = videoRef.current;
    const overlay = overlayRef.current;

    // --- CROP LOGIC ---
    const videoRect = video.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    const cropX = (overlayRect.left - videoRect.left) * scaleX;
    const cropY = (overlayRect.top - videoRect.top) * scaleY;
    const cropWidth = overlayRect.width * scaleX;
    const cropHeight = overlayRect.height * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');

    // Filter: High Contrast (Helps OCR read TV screens)
    ctx.filter = 'contrast(1.4) grayscale(1)';

    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    try {
      // White list chars to avoid reading garbage like "©" or "™"
      const {
        data: { text },
      } = await Tesseract.recognize(canvas, 'eng', {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
      });

      const cleanText = text.trim();
      setDebugText(cleanText);

      if (cleanText.length < 3) {
        setStatus('Text unclear, try zooming in');
        return;
      }

      const results = fuse.search(cleanText);

      if (results.length > 0) {
        // Matches are sorted by score. Lower score = better match.
        // If the best score is too high (bad match), ignore it.
        if (results[0].score < 0.6) {
          setMatch(results[0].item);
          setStatus('Found!');
        } else {
          setStatus('Unsure match');
        }
      } else {
        setStatus('No monster found');
      }
    } catch (err) {
      console.error(err);
      setStatus('Error processing');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', background: '#000' }}>
      {/* CAMERA AREA */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        {/* GREEN BOX */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '80px',
            border: '2px solid #00ff00',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            zIndex: 10,
          }}
        />

        {/* ZOOM SLIDER (Overlay on Camera) */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '10%',
            right: '10%',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ color: 'white', textShadow: '0 0 2px black' }}>-</span>
          <input type="range" min={zoomCap.min} max={zoomCap.max} step={zoomCap.step} value={zoom} onChange={(e) => handleZoom(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <span style={{ color: 'white', textShadow: '0 0 2px black' }}>+</span>
        </div>
      </div>

      {/* RESULT AREA */}
      <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', borderTop: '2px solid #333' }}>
        <button
          onClick={scanRegion}
          disabled={status === 'Scanning...'}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            background: status === 'Scanning...' ? '#444' : '#00ff00',
            color: status === 'Scanning...' ? '#888' : '#000',
            marginBottom: '15px',
          }}
        >
          {status === 'Scanning...' ? 'Scanning...' : 'SCAN'}
        </button>

        {match ? (
          <div style={{ padding: '15px', background: '#333', borderRadius: '8px' }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#00ff00' }}>{match.name}</h2>
            <p style={{ margin: '5px 0' }}>
              Weakness: <strong>{match.weakness}</strong>
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#666' }}>
            <p>{status}</p>
            <small style={{ fontSize: '10px' }}>Raw: {debugText}</small>
          </div>
        )}
      </div>
    </div>
  );
}
