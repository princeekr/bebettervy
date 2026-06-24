import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Home from './pages/Home';
import DailyJournal from './pages/DailyJournal';
import MemoryWall from './pages/MemoryWall';
import MotivationVault from './pages/MotivationVault';
import Goals from './pages/Goals';
import MyJourney from './pages/MyJourney';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="journal" element={<DailyJournal />} />
              <Route path="memories" element={<MemoryWall />} />
              <Route path="motivation" element={<MotivationVault />} />
              <Route path="goals" element={<Goals />} />
              <Route path="journey" element={<MyJourney />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
