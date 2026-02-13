import { useState } from 'react';
import { ArrowLeft, Copy, Check, Zap, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const TYPES = ['Power', 'Speed', 'Tech'];
const ELEMENTS = ['Normal', 'Fire', 'Water', 'Thunder', 'Ice', 'Dragon'];
const AILMENTS = ['poison', 'burn', 'paralysis', 'sleep', 'blast', 'bleed', 'blind'];

const RESIST_OPTS = [
  { label: '↓↓', val: 2, color: '#ff4444', title: 'Very Weak' },
  { label: '↓', val: 1, color: '#ff6b6b', title: 'Weak' },
  { label: '-', val: 0, color: '#222', title: 'Neutral' },
  { label: '↑', val: -1, color: '#4dabf7', title: 'Resist' },
  { label: '↑↑', val: -2, color: '#00d2ff', title: 'Very Resistant' },
];

const COMMON_PARTS = ['Main Body', 'Head', 'Torso', 'Wings', 'Tail', 'Legs', 'Stomach', 'Needle', 'Left Arm', 'Right Arm', 'Back', 'Neck'];

export default function DevEditor() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [hasEnraged, setHasEnraged] = useState(false);

  // --- INITIAL STATE ---
  const getInitialState = () => ({
    id: Date.now(),
    name: '',
    genus: '',
    type: 'Power',
    element: 'Normal',
    ailments: AILMENTS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    elements: ELEMENTS.reduce((acc, key) => ({ ...acc, [key.toLowerCase()]: 0 }), {}),
    parts: [],
    tips: '',
    enraged: null,
  });

  const [data, setData] = useState(getInitialState());

  const handleChange = (field, val) => setData((prev) => ({ ...prev, [field]: val }));

  const handleAilmentChange = (key, val) => {
    setData((prev) => ({
      ...prev,
      ailments: { ...prev.ailments, [key]: val },
    }));
  };

  const handleElementChange = (key, val) => {
    setData((prev) => ({
      ...prev,
      elements: { ...prev.elements, [key]: val },
    }));
  };

  const addPart = (partName) => {
    setData((prev) => ({
      ...prev,
      parts: [...prev.parts, { name: partName, slash: true, pierce: true, blunt: true }],
    }));
  };

  const removePart = (idx) => {
    setData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== idx),
    }));
  };

  const togglePartWeakness = (idx, type) => {
    const newParts = [...data.parts];
    newParts[idx][type] = !newParts[idx][type];
    setData((prev) => ({ ...prev, parts: newParts }));
  };

  const toggleEnraged = () => {
    if (hasEnraged) {
      setHasEnraged(false);
      setData((prev) => ({ ...prev, enraged: null }));
    } else {
      setHasEnraged(true);
      setData((prev) => ({
        ...prev,
        enraged: { trigger: 'Hp < 50%', type: 'Power' },
      }));
    }
  };

  const updateEnraged = (field, val) => {
    setData((prev) => ({
      ...prev,
      enraged: { ...prev.enraged, [field]: val },
    }));
  };

  // --- RESET HANDLER ---
  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the form?')) {
      setData(getInitialState());
      setHasEnraged(false);
      setCopied(false);
    }
  };

  // --- CODE GENERATION LOGIC ---
  const valToConst = (val) => {
    switch (val) {
      case 2:
        return 'WEAKNESS.VERY_WEAK';
      case 1:
        return 'WEAKNESS.WEAK';
      case 0:
        return 'WEAKNESS.NEUTRAL';
      case -1:
        return 'WEAKNESS.RESIST';
      case -2:
        return 'WEAKNESS.VERY_RESISTANT';
      default:
        return 'WEAKNESS.NEUTRAL';
    }
  };

  const typeToConst = (t) => `TYPES.${t.toUpperCase()}`;

  const generateOutput = () => {
    return `{
    id: ${data.id}, // REPLACE WITH REAL ID
    name: "${data.name}",
    genus: "${data.genus}",
    type: ${typeToConst(data.type)},
    element: "${data.element}",
    ailments: {
${Object.entries(data.ailments)
  .map(([k, v]) => `      ${k}: ${valToConst(v)}`)
  .join(',\n')}
    },
    elements: {
${Object.entries(data.elements)
  .map(([k, v]) => `      ${k}: ${valToConst(v)}`)
  .join(',\n')}
    },
    parts: [
${data.parts
  .map(
    (p) => `      {
        name: "${p.name}",
        slash: ${p.slash},
        pierce: ${p.pierce},
        blunt: ${p.blunt},
      }`,
  )
  .join(',\n')}
    ],
    tips: "${data.tips}",
    enraged: ${
      data.enraged
        ? `{
      trigger: "${data.enraged.trigger}",
      type: ${typeToConst(data.enraged.type)}
    }`
        : 'null'
    }
  }`;
  };

  const copyToClipboard = () => {
    const code = generateOutput();
    navigator.clipboard.writeText(code + ',');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      {/* HEADER NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} className="back-button">
          <ArrowLeft size={20} /> Back to Home
        </button>

        <button
          onClick={handleReset}
          style={{
            background: '#333',
            color: '#ff6b6b',
            border: '1px solid #ff6b6b',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <RotateCcw size={16} /> New Monster
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* --- LEFT COLUMN: EDITOR --- */}
        <div className="detail-card">
          <h2 style={{ marginTop: 0, color: 'var(--accent)' }}>Monster Creator</h2>

          {/* BASICS */}
          <div className="form-group">
            <label style={{ color: '#888', fontSize: '12px' }}>Name</label>
            <input className="search-input" value={data.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g. Rathalos" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div>
              <label style={{ color: '#888', fontSize: '12px' }}>Genus</label>
              <input className="search-input" value={data.genus} onChange={(e) => handleChange('genus', e.target.value)} placeholder="Flying Wyvern" />
            </div>
            <div>
              <label style={{ color: '#888', fontSize: '12px' }}>Type</label>
              <select className="search-input" value={data.type} onChange={(e) => handleChange('type', e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: '#888', fontSize: '12px' }}>Element</label>
              <select className="search-input" value={data.element} onChange={(e) => handleChange('element', e.target.value)}>
                {ELEMENTS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="divider" />

          {/* RESISTANCES */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Ailments</span>
            <div className="resist-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {AILMENTS.map((key) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px', borderBottom: '1px solid #222' }}>
                  <span style={{ textTransform: 'capitalize', fontSize: '14px', color: '#ccc' }}>{key}</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {RESIST_OPTS.map((opt) => (
                      <button
                        key={opt.label}
                        title={opt.title}
                        onClick={() => handleAilmentChange(key, opt.val)}
                        style={{
                          background: data.ailments[key] === opt.val ? opt.color : 'transparent',
                          color: data.ailments[key] === opt.val ? 'black' : '#555',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          transition: 'all 0.1s',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Elements</span>
            <div className="resist-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {ELEMENTS.map((key) => {
                const lowerKey = key.toLowerCase();
                return (
                  <div key={lowerKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px', borderBottom: '1px solid #222' }}>
                    <span style={{ textTransform: 'capitalize', fontSize: '14px', color: '#ccc' }}>{key}</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {RESIST_OPTS.map((opt) => (
                        <button
                          key={opt.label}
                          title={opt.title}
                          onClick={() => handleElementChange(lowerKey, opt.val)}
                          style={{
                            background: data.elements[lowerKey] === opt.val ? opt.color : 'transparent',
                            color: data.elements[lowerKey] === opt.val ? 'black' : '#555',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="divider" />

          {/* PARTS BUILDER */}
          <h3>Anatomy</h3>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {COMMON_PARTS.map((p) => (
              <button
                key={p}
                onClick={() => addPart(p)}
                style={{ padding: '6px 12px', background: '#222', border: '1px solid #444', color: '#ddd', borderRadius: '20px', cursor: 'pointer', fontSize: '12px' }}
              >
                + {p}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.parts.map((part, idx) => (
              <div key={idx} className="part-row" style={{ background: '#151515', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ flex: 1, fontWeight: 'bold', color: '#eee' }}>{part.name}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['slash', 'pierce', 'blunt'].map((wType) => (
                    <button
                      key={wType}
                      onClick={() => togglePartWeakness(idx, wType)}
                      className={part[wType] ? 'weapon-best' : 'weapon-bad'}
                      style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid', cursor: 'pointer', textTransform: 'capitalize', fontSize: '12px' }}
                    >
                      {wType}
                    </button>
                  ))}
                </div>
                <button onClick={() => removePart(idx)} style={{ marginLeft: '15px', color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                  X
                </button>
              </div>
            ))}
          </div>

          <hr className="divider" />

          {/* ENRAGED SECTION */}
          <div
            style={{
              background: hasEnraged ? 'rgba(255, 204, 0, 0.05)' : 'transparent',
              padding: '10px',
              borderRadius: '8px',
              border: hasEnraged ? '1px solid #ffcc00' : '1px solid transparent',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: hasEnraged ? '15px' : '0' }}>
              <input type="checkbox" id="enragedCheck" checked={hasEnraged} onChange={toggleEnraged} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="enragedCheck" style={{ fontWeight: 'bold', color: hasEnraged ? '#ffcc00' : '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={16} /> Has Enraged State?
              </label>
            </div>

            {hasEnraged && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ color: '#ffcc00', fontSize: '12px' }}>Trigger Condition</label>
                  <input
                    className="search-input"
                    style={{ borderColor: '#554400' }}
                    value={data.enraged?.trigger || ''}
                    onChange={(e) => updateEnraged('trigger', e.target.value)}
                    placeholder="e.g. Hp < 50%"
                  />
                </div>
                <div>
                  <label style={{ color: '#ffcc00', fontSize: '12px' }}>New Type</label>
                  <select className="search-input" style={{ borderColor: '#554400' }} value={data.enraged?.type || 'Power'} onChange={(e) => updateEnraged('type', e.target.value)}>
                    {TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <hr className="divider" />

          <label style={{ color: '#888', fontSize: '12px' }}>Hunter's Notes / Tips</label>
          <textarea
            className="search-input"
            style={{ minHeight: '80px', fontFamily: 'sans-serif' }}
            value={data.tips}
            onChange={(e) => handleChange('tips', e.target.value)}
            placeholder="Flash bombs work when flying..."
          />
        </div>

        {/* --- RIGHT COLUMN: PREVIEW --- */}
        <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
          <div className="detail-card" style={{ background: '#111', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#666' }}>Code Output</h3>
              <button
                onClick={copyToClipboard}
                style={{
                  display: 'flex',
                  gap: '5px',
                  background: 'var(--accent)',
                  color: 'black',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  alignItems: 'center',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <pre
              style={{
                background: '#000',
                padding: '15px',
                borderRadius: '8px',
                color: '#4ade80',
                overflowX: 'auto',
                fontSize: '12px',
                lineHeight: '1.4',
                border: '1px solid #222',
              }}
            >
              {generateOutput()}
            </pre>
            <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>* Paste into src/monsters.js. Change the ID!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
