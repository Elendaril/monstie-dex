import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MonsterDetail from './pages/MonsterDetail';
import DevEditor from './pages/DevEditor';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/monster/:id" element={<MonsterDetail />} />
        <Route path="/dev" element={<DevEditor />} />
      </Routes>
    </HashRouter>
  );
}
