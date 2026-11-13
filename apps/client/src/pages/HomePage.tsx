import { useEffect, useState } from 'react';
import { PlaceCard } from '../components/PlaceCard';
import { api } from '../lib/api';
import type { PlaceGroup, PlacesGroup, Stats, ViewName } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface HomePageProps {
  onNavigate: (view: ViewName) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {

  const lang: LanguageCode = useLangStore((store) => store.language);
  const [stats, setStats] = useState<Stats | null>(null);
  const [featured, setFeatured] = useState<PlacesGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    api.stats().then(setStats).catch(console.error);
    
    const fetchRoutes = async () => {
      try {
        const data = await api.places(); 
        const filteredData: PlacesGroup = {pl: [], en: []};
        
        for (let placeIdx in data.pl) {
          const fdata_pl = filteredData.pl;
          const fdata_en = filteredData.en;

          if (data.pl[placeIdx].isFeatured) {
            fdata_pl.push(data.pl[placeIdx]);
            fdata_en.push(data.en[placeIdx]);
          }
          if (filteredData.pl.length >= 4) {
            break;
          }
        }
        setFeatured(filteredData);
      } catch (error) {
        console.error("Błąd pobierania danych miejsc:", error);
        setFeatured(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  return (
    <main className="page home-page">
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">{localization.home_main_eb[lang]}</span>
          <h1>{localization.home_main[lang]}</h1>
          <p>{localization.home_main_desc[lang]}</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => onNavigate('map')}>
              {localization.home_main_cta1[lang]}
            </button>
            <button className="secondary" onClick={() => onNavigate('itineraries')}>
              {localization.home_main_cta2[lang]}
            </button>
          </div>
        </div>
        <div className="hero-panel">
          <h2>{localization.home_aside_head[lang]}</h2>
          <ul>
            <li>{localization.home_aside_p1[lang]}</li>
            <li>{localization.home_aside_p2[lang]}</li>
            <li>{localization.home_aside_p3[lang]}</li>
            <li>{localization.home_aside_p4[lang]}</li>
            <li>{localization.home_aside_p5[lang]}</li>
          </ul>
        </div>
      </section>

      <section className="stats-grid" aria-label="Statystyki aplikacji">
        <article>
          <strong>{stats?.totalPlaces ?? '—'}</strong>
          <span>{localization.home_stat1[lang]}</span>
        </article>
        <article>
          <strong>{stats?.totalRoutes ?? '—'}</strong>
          <span>{localization.home_stat2[lang]}</span>
        </article>
        <article>
          <strong>2</strong>
          <span>{localization.home_stat3[lang]}</span>
        </article>
        <article>
          <strong>PWA</strong>
          <span>{localization.home_stat4[lang]}</span>
        </article>
      </section>

      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.home_under_eb[lang]}</span>
          <h2>{localization.home_under_head[lang]}</h2>
        </div>
        <button className="link-button" onClick={() => onNavigate('places')}>
          {localization.home_under_btn[lang]}
        </button>
      </section>
      {!isLoading && (
        <div className="cards-grid compact">
          {featured?.pl.map((place, index) => (
            <PlaceCard key={place.id} place={place} placeEn={featured?.en[index]} onShowOnMap={() => onNavigate('map')} />
          ))}
        </div>
      )}

    </main>
  );
}
