import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { Camera, Search, X, ScanLine, Keyboard } from 'lucide-react'; // Added icons
import { monsters } from '../monsters';
import ScannerModal from '../components/ScannerModal';
import '../App.css';

const fuse = new Fuse(monsters, {
  keys: ['name', 'aliases'],
  threshold: 0.35,
  ignoreLocation: true,
});

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]); // Default to EMPTY
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const fuseResults = fuse.search(query);
    setResults(fuseResults.map((res) => res.item));
  }, [query]);
  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  const getTypeIconPath = (type) => {
    if (!type) return null;
    return `${import.meta.env.BASE_URL}ui/type-${type.toLowerCase()}.svg`;
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', color: 'var(--highlight)', letterSpacing: '2px', marginBottom: '20px' }}>MONSTIE DEX</h1>

      {/* SEARCH BAR */}
      <div className="search-bar-container">
        <div className="search-wrapper">
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
          <input className="search-input" type="text" placeholder="Search monster..." value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '5px',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsCameraOpen(true)}
          style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            width: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Camera size={24} />
        </button>
      </div>
      {query ? (
        results.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
            <p>No monsters found matching "{query}"</p>
          </div>
        ) : (
          <div className="monster-grid">
            {results.map((monster) => (
              <div key={monster.id} className="monster-card" onClick={() => navigate(`/monster/${monster.id}`)}>
                <img src={getTypeIconPath(monster.type)} alt={monster.type} style={{ width: '40px', height: '40px' }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{monster.name}</h3>
                    <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>{monster.type}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{monster.genus}</div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
            color: '#444',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '30px', display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#222', padding: '20px', borderRadius: '50%', border: '1px solid #333' }}>
                <ScanLine size={32} color="var(--accent)" />
              </div>
              <span style={{ fontSize: '14px' }}>Scan Name</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#222', padding: '20px', borderRadius: '50%', border: '1px solid #333' }}>
                <Keyboard size={32} color="#888" />
              </div>
              <span style={{ fontSize: '14px' }}>Type Name</span>
            </div>
          </div>
          <p style={{ maxWidth: '300px', lineHeight: '1.5' }}>Point your camera at the Monster Name on your TV, or type it manually to see weaknesses.</p>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop: '50px', textAlign: 'center', opacity: 0.2 }}>
        <span onClick={() => navigate('/dev')} style={{ cursor: 'pointer' }}>
          Build v0.5 | v{__COMMIT_HASH__}
        </span>
      </div>

      <ScannerModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onScanComplete={setQuery} />
    </div>
  );
}
