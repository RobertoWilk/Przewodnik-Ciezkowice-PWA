import type { User, ViewName } from '../types';
import { localNav, localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';


interface HeaderProps {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  user?: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  language: string;
  onToggleLanguage: () => void;
}



export function Header({
  activeView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  onOpenSettings,
  language,
  onToggleLanguage
}: HeaderProps) {

  const lang: LanguageCode = useLangStore((store) => store.language);

  return (
    <header className="app-header">
      <button className="brand" onClick={() => onNavigate('home')} aria-label="Strona główna">
        <span className="brand-mark">C</span>
        <span>
          <strong>{localization.hd_title[lang]}</strong>
          <small>{localization.hd_lower_title[lang]}</small>
        </span>
      </button>

      <nav className="main-nav" aria-label="Główna nawigacja">
        {localNav.filter((item) => !['admin', 'tests'].includes(item.view) || user?.role === 'admin' || user?.role === 'moderator').map((item) => (
          <button
            key={item.view}
            className={activeView === item.view ? 'active' : ''}
            onClick={() => onNavigate(item.view)}
          >
            {language === 'pl' ? item.labelPl : item.labelEn}
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <button className="language-pill" title="Przełącz język interfejsu" onClick={onToggleLanguage}>
          {language.toUpperCase()}
        </button>
        <button className="settings-pill" onClick={onOpenSettings} title="Ustawienia aplikacji">
          ⚙️
        </button>
        {user ? (
          <div className="user-chip">
            <span>{user.role === 'admin' ? 'Administrator' : user.role === 'moderator' ? 'Moderator' : user.email}</span>
            <button onClick={onOpenProfile}>{localization.hd_profile[lang]}</button>
            <button onClick={onLogout}>{localization.hd_logout[lang]}</button>
          </div>
        ) : (
          <button className="primary small" onClick={onOpenAuth}>
            {localization.hd_account[lang]}
          </button>
        )}
      </div>
    </header>
  );
}
