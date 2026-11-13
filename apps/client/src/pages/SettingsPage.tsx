import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { AppSettings, User } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface SettingsPageProps {
  token?: string;
  user?: User | null;
  language: string;
  onSetLanguage: () => void;
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
}

const fallbackSettings: AppSettings = {
  appTitle: 'Przewodnik Ciężkowice',
  appSubtitle: 'PWA • mapa • trasy • historia',
  contactEmail: '',
  contactPhone: '',
  englishEnabled: true
};

export function SettingsPage({ token, user, language, onSetLanguage, theme, onSetTheme }: SettingsPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const [settings, setSettings] = useState<AppSettings>(fallbackSettings);
  const [message, setMessage] = useState('');
  const isAdmin = Boolean(token && user?.role === 'admin');

  useEffect(() => {
    api.settings().then(setSettings).catch(console.error);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    const updated = await api.adminUpdateSettings(settings, token);
    setSettings(updated);
    setMessage(localization.sett_save_suc[lang]);
  }

  return (
    <main className="page settings-page">
      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.sett_eb[lang]}</span>
          <h1>{localization.sett_header[lang]}</h1>
          <p>{localization.sett_desc[lang]}</p>
        </div>
      </section>
      <section className="detail-grid">
        <article className="article-card">
          <h2>{localization.sett_pref[lang]}</h2>
          <div className="settings-options">
            <label>{localization.sett_lang[lang]}
              <select value={language} onChange={onSetLanguage}>
                <option value="pl">Polski</option>
                <option value="en" disabled={!settings.englishEnabled}>English</option>
              </select>
            </label>
            <label>{localization.sett_theme[lang]}
              <select value={theme} onChange={(event) => onSetTheme(event.target.value as 'light' | 'dark')}>
                <option value="light">{localization.sett_theme_light[lang]}</option>
                <option value="dark">{localization.sett_theme_dark[lang]}</option>
              </select>
            </label>
          </div>
        </article>
        <article className="article-card">
          <h2>{localization.sett_info[lang]}</h2>
          <p><strong>{settings.appTitle}</strong></p>
          <p>{settings.appSubtitle}</p>
          {settings.contactEmail && <p>E-mail: {settings.contactEmail}</p>}
          {settings.contactPhone && <p>{localization.sett_phone[lang]}: {settings.contactPhone}</p>}
        </article>
      </section>
      {isAdmin && (
        <form className="admin-form settings-admin-form" onSubmit={submit}>
          <h2>{localization.sett_admin[lang]}</h2>
          <div className="form-grid two">
            <label>{localization.sett_admin_title[lang]}<input value={settings.appTitle} onChange={(e) => setSettings((current) => ({ ...current, appTitle: e.target.value }))} /></label>
            <label>{localization.sett_admin_subt[lang]}<input value={settings.appSubtitle} onChange={(e) => setSettings((current) => ({ ...current, appSubtitle: e.target.value }))} /></label>
            <label>{localization.sett_admin_email[lang]}<input value={settings.contactEmail} onChange={(e) => setSettings((current) => ({ ...current, contactEmail: e.target.value }))} /></label>
            <label>{localization.sett_admin_phone[lang]}<input value={settings.contactPhone} onChange={(e) => setSettings((current) => ({ ...current, contactPhone: e.target.value }))} /></label>
            <label>{localization.sett_admin_lang[lang]}
              <select value={String(settings.englishEnabled)} onChange={(e) => setSettings((current) => ({ ...current, englishEnabled: e.target.value === 'true' }))}>
                <option value="true">{localization.sett_on[lang]}</option>
                <option value="false">{localization.sett_off[lang]}</option>
              </select>
            </label>
          </div>
          <button className="primary">{localization.sett_save[lang]}</button>
          {message && <p className="success-box">{message}</p>}
        </form>
      )}
    </main>
  );
}
