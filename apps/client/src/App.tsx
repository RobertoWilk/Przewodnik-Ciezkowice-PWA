import { useEffect, useState } from 'react';
import { AuthDialog } from './components/AuthDialog';
import { Header } from './components/Header';
import { api } from './lib/api';
import { AdminPage } from './pages/AdminPage';
import { GalleryPage } from './pages/GalleryPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { ItinerariesPage } from './pages/ItinerariesPage';
import { MapPage } from './pages/MapPage';
import { NearbyPage } from './pages/NearbyPage';
import { PlaceDetailsPage } from './pages/PlaceDetailsPage';
import { PlacesPage } from './pages/PlacesPage';
import { PlannerPage } from './pages/PlannerPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { SourcesPage } from './pages/SourcesPage';
import { TestCenterPage } from './pages/TestCenterPage';
import type { AuthResult, Place, User, ViewName } from './types';

import { useLangStore } from './stores/LangStore';


const tokenKey = 'ciezkowice.token';
const languageKey = 'ciezkowice.language';
const themeKey = 'ciezkowice.theme';

export function App() {
  const [view, setView] = useState<ViewName>('home');
  const [authOpen, setAuthOpen] = useState(false);
  const [token, setToken] = useState<string | undefined>(() => localStorage.getItem(tokenKey) ?? undefined);
  const [user, setUser] = useState<User | null>(null);
  const [selectedPlaceSlug, setSelectedPlaceSlug] = useState<string | undefined>();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light'));

  const language = useLangStore((state) => state.language);
  const changeLang = useLangStore((state) => state.changeLang);

  useEffect(() => {
    if (!token) return;
    api
      .me(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(tokenKey);
        setToken(undefined);
        setUser(null);
      });
  }, [token]);

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(languageKey, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(themeKey, theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);

  async function authenticate(mode: 'login' | 'register', email: string, password: string) {
    const result: AuthResult = mode === 'login' ? await api.login(email, password) : await api.register(email, password);
    localStorage.setItem(tokenKey, result.token);
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    localStorage.removeItem(tokenKey);
    setToken(undefined);
    setUser(null);
  }

  function openPlace(place: Place) {
    setSelectedPlaceSlug(place.slug);
    setView('place');
  }

  return (
    <div className="app-shell">
      <Header
        activeView={view}
        onNavigate={setView}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={logout}
        onOpenProfile={() => setView('profile')}
        onOpenSettings={() => setView('settings')}
        language={language}
        onToggleLanguage={changeLang}
      />
      {view === 'home' && <HomePage onNavigate={setView} />}
      {view === 'map' && <MapPage token={token} />}
      {view === 'nearby' && <NearbyPage onOpenPlace={openPlace} onShowMap={() => setView('map')} />}
      {view === 'places' && <PlacesPage token={token} onOpenAuth={() => setAuthOpen(true)} onShowMap={() => setView('map')} onOpenPlace={openPlace} />}
      {view === 'place' && <PlaceDetailsPage slug={selectedPlaceSlug} token={token} onBack={() => setView('places')} onShowMap={() => setView('map')} onOpenAuth={() => setAuthOpen(true)} />}
      {view === 'gallery' && <GalleryPage onOpenPlace={openPlace} />}
      {view === 'planner' && <PlannerPage onOpenPlace={openPlace} />}
      {view === 'itineraries' && <ItinerariesPage />}
      {view === 'history' && <HistoryPage />}
      {view === 'sources' && <SourcesPage />}
      {view === 'profile' && <ProfilePage token={token} user={user} onOpenAuth={() => setAuthOpen(true)} onOpenPlace={openPlace} />}
      {view === 'settings' && <SettingsPage token={token} user={user} language={language} onSetLanguage={changeLang} theme={theme} onSetTheme={setTheme} />}
      {view === 'tests' && <TestCenterPage token={token} user={user} onOpenAuth={() => setAuthOpen(true)} />}
      {view === 'admin' && <AdminPage token={token} user={user} onOpenAuth={() => setAuthOpen(true)} />}
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onSubmit={authenticate} />
    </div>
  );
}
