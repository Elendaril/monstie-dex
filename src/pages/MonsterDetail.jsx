import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, ShieldAlert, Zap } from 'lucide-react';
import { monsters } from '../monsters';
import '../App.css';

const getAssetUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

const AILMENT_ORDER = ['poison', 'burn', 'paralysis', 'sleep', 'blast', 'bleed', 'blind'];
const ELEMENT_ORDER = ['normal', 'fire', 'water', 'thunder', 'ice', 'dragon'];

const TypeIcon = ({ type }) => <img src={getAssetUrl(`/ui/type-${type?.toLowerCase()}.svg`)} alt={type} title={type} style={{ width: '64px', height: '64px' }} />;

const ElementIcon = ({ element }) => {
  if (!element) return null;
  const slug = element.toLowerCase() === 'normal' ? 'none' : element.toLowerCase();
  return <img src={getAssetUrl(`/ui/element-${slug}.svg`)} alt={element} title={element} style={{ width: '24px', height: '24px' }} />;
};

const StatusIcon = ({ status }) => {
  const map = {
    poison: 'status_poison.webp',
    burn: 'status_burn.webp',
    paralysis: 'status_paralysis.webp',
    sleep: 'status_sleep.webp',
    blast: 'status_blastblight.webp',
    bleed: 'status_bleeding.webp',
    blind: null,
  };
  const file = map[status.toLowerCase()];
  if (!file) return <span style={{ fontSize: '10px' }}>{status.slice(0, 3)}</span>;
  if (!file) return <span style={{ fontSize: '10px' }}>{status.slice(0, 3)}</span>;
  return <img src={getAssetUrl(`/ui/${file}`)} alt={status} title={status} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />;
};

const getWeaponClass = (isEffective) => {
  return isEffective ? 'weapon-best' : 'weapon-bad';
};
const WeaponIcon = ({ type, isEffective }) => {
  const slug = type.toLowerCase();
  const iconName = isEffective ? `weapon-${slug}.svg` : `weapon-${slug}-ineffective.svg`;

  return (
    <img
      src={getAssetUrl(`/ui/${iconName}`)}
      alt={type}
      title={type}
      style={{
        width: '36px',
        height: '36px',
        opacity: isEffective ? 1 : 0.7,
        bgColor: isEffective ? 'transparent' : 'rgba(255, 0, 0, 0.1)',
      }}
    />
  );
};

export default function MonsterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseData = monsters.find((m) => m.id === parseInt(id));
  const [activeVariant, setActiveVariant] = useState('normal');

  if (!baseData) return <div className="container">Monster not found</div>;
  const currentData = activeVariant === 'normal' ? baseData : { ...baseData, ...baseData.variants[activeVariant] };

  // --- HELPERS ---
  const renderResist = (value) => {
    switch (value) {
      case 2:
        return <span className="arrow-very-weak">↓↓</span>;
      case 1:
        return <span className="arrow-weak">↓</span>;
      case -1:
        return <span className="arrow-resist">↑</span>;
      case -2:
        return <span className="arrow-very-resist">↑↑</span>;
      default:
        return <span className="arrow-neutral">-</span>;
    }
  };

  const getWeaponClass = (isEffective) => {
    return isEffective ? 'weapon-best' : 'weapon-bad';
  };

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="detail-card">
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <TypeIcon type={currentData.type} />
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem' }}>{baseData.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', color: '#aaa', fontSize: '14px' }}>
                <span>Element:</span>
                <ElementIcon element={currentData.element} />
                <span style={{ color: 'white', textTransform: 'capitalize' }}>{currentData.element}</span>
              </div>
            </div>
          </div>

          {/* VARIANT TABS */}
          {baseData.variants && (
            <div className="toggle-container">
              <button className={`toggle-btn ${activeVariant === 'normal' ? 'active' : ''}`} onClick={() => setActiveVariant('normal')}>
                Normal
              </button>
              {Object.keys(baseData.variants).map((variant) => (
                <button key={variant} className={`toggle-btn ${activeVariant === variant ? 'active-feral' : ''}`} onClick={() => setActiveVariant(variant)}>
                  {variant}
                </button>
              ))}
            </div>
          )}
        </div>

        <hr className="divider" />

        {/* STATS GRID */}
        <div className="stats-layout">
          {/* LEFT COLUMN: RESISTANCES */}
          <div className="stat-block">
            <h3 className="section-title">
              <ShieldAlert size={16} /> Resistances
            </h3>

            <div className="resist-row">
              <div className="resist-label">Ailments</div>
              <div className="resist-grid">
                {AILMENT_ORDER.map((key) => (
                  <div key={key} className="resist-cell">
                    <StatusIcon status={key} />
                    {renderResist(currentData.ailments?.[key])}
                  </div>
                ))}
              </div>
            </div>

            <div className="resist-row">
              <div className="resist-label">Elements</div>
              <div className="resist-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                {ELEMENT_ORDER.map((key) => (
                  <div key={key} className="resist-cell">
                    <ElementIcon element={key} />
                    {renderResist(currentData.elements?.[key])}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ANATOMY */}
          <div className="stat-block">
            <h3 className="section-title">
              <Crosshair size={16} /> Anatomy
            </h3>
            {currentData.parts?.map((part, idx) => (
              <div key={idx} className="part-row">
                <span className="part-name">{part.name}</span>
                <div className="part-weaks">
                  {/* SLASH */}
                  <div className={`weapon-box ${getWeaponClass(part.slash)}`}>
                    <WeaponIcon type="slash" isEffective={part.slash} />
                  </div>

                  {/* PIERCE */}
                  <div className={`weapon-box ${getWeaponClass(part.pierce)}`}>
                    <WeaponIcon type="pierce" isEffective={part.pierce} />
                  </div>

                  {/* BLUNT */}
                  <div className={`weapon-box ${getWeaponClass(part.blunt)}`}>
                    <WeaponIcon type="blunt" isEffective={part.blunt} />
                  </div>
                </div>
              </div>
            ))}

            {currentData.enraged && (
              <div className="enraged-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap color="#ffcc00" size={18} />
                  <strong>ENRAGED STATE</strong>
                </div>
                <div style={{ marginTop: '5px', fontSize: '14px', color: '#ffeeb0' }}>
                  Switches to <strong style={{ textTransform: 'uppercase' }}>{currentData.enraged.type}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NOTES */}
        <div className="notes-section">
          <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '5px' }}>Hunter's Notes:</strong>
          {currentData.tips}
        </div>
      </div>
    </div>
  );
}
