import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PlaceCard } from '../components/PlaceCard';
import { api } from '../lib/api';
import { categoryEmoji, useCategoryLabels } from '../lib/labels';
import type { CategoryStat, Place, PlaceCategory, PlacesGroup } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface PlacesPageProps {
  token?: string;
  onOpenAuth: () => void;
  onShowMap: () => void;
  onOpenPlace: (place: Place) => void;
}

export function PlacesPage({ token, onOpenAuth, onShowMap, onOpenPlace }: PlacesPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const categoryLabels = useCategoryLabels();
  const [places, setPlaces] = useState<PlacesGroup | null>(null);
  const [favorites, setFavorites] = useState<PlacesGroup | null>(null);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [category, setCategory] = useState<PlaceCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const [arePlacesLoading, setArePlacesLoading] = useState(true);
  const [areFavoritesLoading, setAreFavoritesLoading] = useState(true);  


  useEffect(() => {
    api.categories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    loadPlaces().catch(console.error);
  }, [category]);

  useEffect(() => {
    //if (token) api.favorites(token).then(setFavorites).catch(console.error);
    //else setFavorites([]);

    const fetchFavorites = async () => {
      try {
        if (!token) throw "Cannot fetch 'favourites' data - token is undefined.";
        const data = await api.favorites(token);
        setFavorites(data);
      } catch (error) {
        console.error("Błąd pobierania danych miejsc:", error);
        setFavorites(null);
      } finally {
        setAreFavoritesLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  const favoriteIds = useMemo(() => new Set(favorites?.pl.map((item) => item.id)), [favorites]);

  async function loadPlaces() {
    //const result = await api.places({ q: query, category });
    //setPlaces(result);

    const fetchPlaces = async () => {
      try {
        const data = await api.places({ q: query, category });
        setPlaces(data);
      } catch (error) {
        console.error("Błąd pobierania danych miejsc:", error);
        setPlaces(null);
      } finally {
        setArePlacesLoading(false);
      }
    };

    fetchPlaces();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await loadPlaces();
    if (query.trim()) await api.saveSearch(query.trim(), token).catch(() => undefined);
  }

  async function toggleFavorite(place: Place) {
    if (!token) {
      onOpenAuth();
      return;
    }
    if (!favorites) return;

    if (favoriteIds.has(place.id)) {
      await api.removeFavorite(place.id, token);

      const favFilteredPl = favorites.pl.filter((item) => item.id !== place.id);
      const favFilteredEn = favorites.en.filter((item) => item.id !== place.id);

      setFavorites({pl: favFilteredPl, en: favFilteredEn});
      setMessage(localization.plcs_unfav[lang]);
    } else {
      await api.addFavorite(place.id, token);
      const placeLang = places?.en.filter((item) => item.id === place.id)[0];
      setFavorites((current) => {
        if (!current || !placeLang) return current;
        current.pl.push(place);
        current.en.push(placeLang);
        return current;
      });
      setMessage(localization.plcs_fav[lang]);
    }
  }

  return (
    <main className="page">
      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.plcs_eb[lang]}</span>
          <h1>{localization.plcs_header[lang]}</h1>
          <p>{localization.plcs_desc[lang]}</p>
        </div>
      </section>

      <form className="toolbar" onSubmit={submit}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={localization.plcs_search_pch[lang]} />
        <button className="primary">{localization.cmn_search[lang]}</button>
      </form>

      <div className="filter-list horizontal">
        <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>
          🗺️ {localization.lbl_all[lang]}
        </button>
        {categories.map((item) => (
          <button key={item.category} className={category === item.category ? 'active' : ''} onClick={() => setCategory(item.category)}>
            {categoryEmoji[item.category]} {categoryLabels[item.category]} ({item.count})
          </button>
        ))}
      </div>

      {message && <p className="success-box">{message}</p>}

      <div className="cards-grid">
        {places?.pl.map((place, index) => (
          <PlaceCard
            key={place.id}
            place={place}
            placeEn={places?.en[index]}
            favorite={favoriteIds.has(place.id)}
            onToggleFavorite={toggleFavorite}
            onShowOnMap={onShowMap}
            onOpenPlace={onOpenPlace}
          />
        ))}
      </div>
    </main>
  );
}
