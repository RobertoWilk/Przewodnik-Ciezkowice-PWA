import { FormEvent, useEffect, useState } from 'react';
import { PlaceCard } from '../components/PlaceCard';
import { api } from '../lib/api';
import { getVisitedSlugs } from '../lib/visited';
import type { Place, PlacesGroup, User } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface ProfilePageProps {
  token?: string;
  user?: User | null;
  onOpenAuth: () => void;
  onOpenPlace: (place: Place) => void;
}

export function ProfilePage({ token, user, onOpenAuth, onOpenPlace }: ProfilePageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const [favorites, setFavorites] = useState<PlacesGroup | null>(null);
  const [places, setPlaces] = useState<PlacesGroup | null>(null);
  const [visitedSlugs, setVisitedSlugs] = useState<string[]>(() => getVisitedSlugs());
  const [history, setHistory] = useState<Array<{ id: number; query: string; createdAt: string }>>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.favorites(token).then(setFavorites).catch(console.error);
    api.searchHistory(token).then(setHistory).catch(console.error);
    api.places().then(setPlaces).catch(console.error);
    setVisitedSlugs(getVisitedSlugs());
  }, [token]);

  const visitedPlaces = places?.pl.filter((place) => visitedSlugs.includes(place.slug));

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setPasswordMessage('');
    setPasswordError('');
    try {
      const result = await api.changePassword(currentPassword, newPassword, token);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage(result.message);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : localization.prof_pass_fail[lang]);
    }
  }

  if (!token || !user) {
    return (
      <main className="page article-page">
        <span className="eyebrow">{localization.prof_eb[lang]}</span>
        <h1>{localization.prof_guest_header[lang]}</h1>
        <p>{localization.prof_guest_desc[lang]}</p>
        <button className="primary" onClick={onOpenAuth}>{localization.prof_guest_cta[lang]}</button>
      </main>
    );
  }

  return (
    <main className="page profile-page">
      <section className="profile-hero-card">
        <div className="profile-avatar" aria-hidden="true">{profileInitial(user)}</div>
        <div className="profile-hero-content">
          <span className="eyebrow">{localization.prof_eb[lang]}</span>
          <h1>{displayName(user)}</h1>
          <p>{localization.prof_desc[lang]}</p>
          <div className="profile-badges">
            <span>{roleLabel(user.role)}</span>
            <span>{user.email}</span>
            <span>{localization.prof_bdg_crt[lang]}: {new Date(user.createdAt).toLocaleDateString('pl-PL')}</span>
          </div>
        </div>
      </section>

      <section className="profile-stats-grid">
        <article><strong>{favorites?.pl.length}</strong><span>{localization.prof_stat_fav[lang]}</span></article>
        <article><strong>{visitedPlaces?.length}</strong><span>{localization.prof_stat_vis[lang]}</span></article>
        <article><strong>{history.length}</strong><span>{localization.prof_stat_srch[lang]}</span></article>
        <article><strong>{roleLabel(user.role)}</strong><span>{localization.prof_stat_role[lang]}</span></article>
      </section>

      <section className="profile-main-grid">
        <article className="article-card profile-panel">
          <h2>{localization.prof_srch_head[lang]}</h2>
          {history.length ? (
            <ul className="search-history-list">
              {history.map((item) => <li key={item.id}><strong>{item.query}</strong><span>{new Date(item.createdAt).toLocaleString('pl-PL')}</span></li>)}
            </ul>
          ) : <EmptyProfileState icon="🔎" title={localization.prof_srch_empty[lang]}
           text={localization.prof_srch_desc[lang]} />}
        </article>

        <form className="article-card profile-password-form profile-panel" onSubmit={changePassword}>
          <h2>{localization.prof_pass_chng[lang]}</h2>
          <p className="muted">{localization.prof_pass_req[lang]}</p>
          <label>{localization.prof_pass_curr[lang]}<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
          <label>{localization.prof_pass_new[lang]}<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} required /></label>
          <button className="primary">{localization.prof_pass_chng[lang]}</button>
          {passwordMessage && <p className="success-box">{passwordMessage}</p>}
          {passwordError && <p className="error-box">{passwordError}</p>}
        </form>
      </section>

      <section className="profile-section-card">
        <div className="section-heading compact-heading"><h2>{localization.prof_fav_head[lang]}</h2><span>{favorites?.pl.length}</span></div>
        {favorites?.pl.length ? (
          <div className="cards-grid profile-cards-grid">
            {favorites?.pl.map((place, index) => (
              <PlaceCard key={place.id} place={place} placeEn={favorites?.en[index]} onOpenPlace={onOpenPlace} />
            ))}
          </div>
        ) : <EmptyProfileState icon="★" title={localization.prof_fav_empty[lang]}
         text={localization.prof_fav_desc[lang]} />}
      </section>

      <section className="profile-section-card">
        <div className="section-heading compact-heading"><h2>{localization.prof_vis_head[lang]}</h2><span>{visitedPlaces?.length}</span></div>
        {visitedPlaces?.length ? (
          <div className="cards-grid profile-cards-grid">
            {visitedPlaces.map((place) => {
              const placeEn = places?.en.filter((place_en) => place_en.id === place.id)[0];
              return <PlaceCard key={place.id} place={place} placeEn={placeEn} onOpenPlace={onOpenPlace} />
            })}
          </div>
        ) : <EmptyProfileState icon="✓" title={localization.prof_vis_empty[lang]}
         text={localization.prof_vis_desc[lang]} />}
      </section>
    </main>
  );
}

function displayName(user: User) {
    const lang: LanguageCode = useLangStore((store) => store.language);

  if (user.role === 'admin') return localization.prof_role_admin[lang];
  if (user.role === 'moderator') return localization.prof_role_mod[lang];
  return user.email;
}

function profileInitial(user: User) {
  if (user.role === 'admin') return 'A';
  if (user.role === 'moderator') return 'M';
  return user.email.slice(0, 1).toUpperCase();
}

function roleLabel(role: User['role']) {
  const lang: LanguageCode = useLangStore((store) => store.language);

  const labels: Record<User['role'], string> = {
    admin: localization.prof_role_admin[lang],
    moderator: localization.prof_role_mod[lang],
    user: localization.prof_role_user[lang]
  };
  return labels[role];
}

function EmptyProfileState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="empty-profile-state">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
