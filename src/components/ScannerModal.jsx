import { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { X, Camera, RefreshCw } from 'lucide-react';
import '../App.css';

export default function ScannerModal({ isOpen, onClose, onScanComplete }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Scan');
  const [debugImg, setDebugImg] = useState(null);

  useEffect(() => {
    let stream = null;
    if (isOpen) {
      setStatus('Scan');
      setDebugImg(null);
      startCamera().then((s) => (stream = s));
    }
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error(err);
      setStatus('Error');
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current) return;
    setStatus('Processing...');
    setDebugImg(null);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cropWidth = video.videoWidth * 0.7;
    const cropHeight = video.videoHeight * 0.15;
    const startX = (video.videoWidth - cropWidth) / 2;
    const startY = (video.videoHeight - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const imgData = ctx.getImageData(0, 0, cropWidth, cropHeight);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const newValue = avg > 100 ? 0 : 255;

      data[i] = newValue; // R
      data[i + 1] = newValue; // G
      data[i + 2] = newValue; // B
    }

    ctx.putImageData(imgData, 0, 0);
    setDebugImg(canvas.toDataURL());

    // --- 3. RUN OCR ---
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(canvas, 'eng', {
        tessedit_pageseg_mode: '7', // Single line mode
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-',
      });

      const clean = text.replace(/[^a-zA-Z\s\-]/g, '').trim();

      if (clean.length > 2) {
        onScanComplete(clean);
        onClose();
      } else {
        alert(`Scanned: "${clean}"\nToo short/unclear. Try holding steady.`);
      }
    } catch (e) {
      console.error(e);
      alert('OCR Error: ' + e.message);
    } finally {
      setStatus('Scan');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      {/* Header */}
      <div style={{ padding: '15px', background: '#000', display: 'flex', justifyContent: 'space-between', color: 'white', zIndex: 10 }}>
        <span style={{ fontWeight: 'bold' }}>Scan Monster Name</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px' }}>
          <X size={24} />
        </button>
      </div>

      {/* Camera View - Takes FULL height */}
      <div style={{ flex: 1, position: 'relative', background: 'black', overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        {/* Visual Box */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '15%',
            border: '2px solid #00ff00',
            boxShadow: '0 0 0 100vmax rgba(0,0,0,0.6)', // Dims the outside
            borderRadius: '8px',
            zIndex: 5,
            pointerEvents: 'none', // Let clicks pass through
          }}
        >
          <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', color: '#00ff00', fontSize: '12px', fontWeight: 'bold', textShadow: '0 1px 2px black' }}>
            ALIGN NAME HERE
          </div>
        </div>

        {/* DEBUG PREVIEW (Bottom Right) */}
        {debugImg && (
          <div style={{ position: 'absolute', bottom: '100px', right: '10px', zIndex: 20, background: 'white', padding: '2px', border: '1px solid red' }}>
            <p style={{ color: 'black', margin: 0, fontSize: '10px' }}>OCR Sees:</p>
            <img src={debugImg} alt="Debug" style={{ width: '120px', display: 'block' }} />
          </div>
        )}

        {/* SCAN BUTTON (Overlay at Bottom Center) */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <button
            onClick={captureAndScan}
            disabled={status === 'Processing...'}
            style={{
              background: status === 'Processing...' ? '#555' : 'var(--accent)',
              color: 'black',
              border: '4px solid rgba(0,0,0,0.5)',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            }}
          >
            {status === 'Processing...' ? <RefreshCw className="spin" size={32} /> : <Camera size={32} />}
          </button>
        </div>
      </div>
    </div>
  );
}
