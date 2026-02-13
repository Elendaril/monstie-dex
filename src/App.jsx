import { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import Fuse from 'fuse.js';
import { monsters } from './monsters';

// 1. Setup Fuzzy Search
const fuse = new Fuse(monsters, {
  keys: ['name'],
  threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything. 0.4 is good for OCR typos.
});

export default function App() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [status, setStatus] = useState('Idle'); // Idle, Scanning, Found, Error
  const [match, setMatch] = useState(null);
  const [debugText, setDebugText] = useState('');

  // 2. Start Camera on Mount
  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Back camera
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera Error:', err);
      setStatus('Camera Error: Check permissions');
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

    // Calculate scale in case video is displayed smaller than actual resolution
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

    // Draw only the area inside the box
    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // --- OCR LOGIC ---
    try {
      // Create a temporary worker to ensure fresh state
      const {
        data: { text },
      } = await Tesseract.recognize(canvas, 'eng');

      // Clean string: Remove special chars, keep letters only
      const cleanText = text.replace(/[^a-zA-Z\s]/g, '').trim();
      setDebugText(cleanText);

      // --- SEARCH LOGIC ---
      if (cleanText.length < 3) {
        setStatus('Text too short, try again');
        return;
      }

      const results = fuse.search(cleanText);

      if (results.length > 0) {
        setMatch(results[0].item); // Best match
        setStatus('Found!');
      } else {
        setStatus('No monster found');
      }
    } catch (err) {
      console.error(err);
      setStatus('Error processing image');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
      {/* CAMERA VIEWPORT */}
      <div style={{ position: 'relative', flex: 1, backgroundColor: 'black', overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        {/* OVERLAY BOX */}
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
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)', // Dims outside
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#00ff00', fontSize: '12px', background: 'black', padding: '2px' }}>ALIGN NAME HERE</span>
        </div>
      </div>

      {/* RESULTS PANEL */}
      <div style={{ padding: '20px', background: '#222', color: 'white', minHeight: '200px' }}>
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <button
            onClick={scanRegion}
            disabled={status === 'Scanning...'}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '30px',
              border: 'none',
              backgroundColor: status === 'Scanning...' ? '#555' : '#00d2ff',
              color: status === 'Scanning...' ? '#aaa' : '#000',
              width: '100%',
            }}
          >
            {status === 'Scanning...' ? 'Processing...' : 'SCAN MONSTER'}
          </button>
        </div>

        {/* INFO CARD */}
        {match ? (
          <div style={{ background: '#333', padding: '15px', borderRadius: '10px', border: '1px solid #444' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#ffcc00' }}>{match.name}</h2>
            <p>
              <strong>Weakness:</strong> {match.weakness}
            </p>
            <p>
              <strong>Type:</strong> {match.type}
            </p>
          </div>
        ) : (
          <div style={{ color: '#aaa', textAlign: 'center', marginTop: '20px' }}>
            <p>{status}</p>
            <small>OCR read: "{debugText}"</small>
          </div>
        )}
      </div>
    </div>
  );
}
