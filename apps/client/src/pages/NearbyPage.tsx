import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { categoryEmoji, useCategoryLabels } from '../lib/labels';
import { getVisitedSlugs, toggleVisitedSlug } from '../lib/visited';
import type { Place, PlaceCategory, PlacesGroup } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface NearbyPageProps {
  onOpenPlace: (place: Place) => void;
  onShowMap: () => void;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  source: 'gps' | 'center';
}

const ciezkowiceCenter: UserLocation = { latitude: 49.786389, longitude: 20.974167, source: 'center' };

export function NearbyPage({ onOpenPlace, onShowMap }: NearbyPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const categoryLabels = useCategoryLabels();

  const [places, setPlaces] = useState<PlacesGroup | null>(null);
  const [location, setLocation] = useState<UserLocation>(ciezkowiceCenter);
  const [category, setCategory] = useState<PlaceCategory | 'all'>('all');
  const [radius, setRadius] = useState('10');
  const [status, setStatus] = useState(localization.nav_state_cityloc[lang]);
  const [visited, setVisited] = useState<string[]>(() => getVisitedSlugs());

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.places().then(setPlaces).catch(console.error);

    const fetchPlaces = async () => {
      try {
        const data = await api.places();
        setPlaces(data);
      } catch (error) {
        console.error("Błąd pobierania danych miejsc:", error);
        setPlaces(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  const categories = useMemo(() => Array.from(new Set(places?.pl.map((place) => place.category))), [places]);

  const placesWithDistance = useMemo(() => {
    if (isLoading || !places) return;
    const maxDistance = Number(radius);
    return places.pl
      .filter((place) => category === 'all' || place.category === category)
      .map((place, index) => {
        const placeEn = places.en[index];
        const placeLang = (lang === "pl" ? place : placeEn)
        return ({ place, placeLang, distanceKm: distanceKm(location.latitude, location.longitude, place.latitude, place.longitude) })
      })
      .filter((item) => item.distanceKm <= maxDistance)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [places, location, category, radius]);

  function locate() {
    if (!navigator.geolocation) {
      setStatus(localization.nav_state_unsup[lang]);
      return;
    }

    setStatus(localization.nav_state_sort[lang]);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, source: 'gps' });
        setStatus('Lokalizacja GPS aktywna — miejsca są sortowane od najbliższych.');
      },
      () => {
        setLocation(ciezkowiceCenter);
        setStatus(localization.nav_state_noperm[lang]);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function toggleVisited(place: Place) {
    setVisited(toggleVisitedSlug(place.slug));
  }

  return (
    <main className="page nearby-page">
      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.near_eb[lang]}</span>
          <h1>{localization.near_header[lang]}</h1>
          <p>{localization.near_desc[lang]}</p>
        </div>
        <button className="primary" onClick={locate}>{localization.near_user_loc[lang]}</button>
      </section>

      <section className="nearby-controls">
        <label>
          {localization.near_ctrl_rad[lang]}
          <select value={radius} onChange={(event) => setRadius(event.target.value)}>
            <option value="1">1 km</option>
            <option value="3">3 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="25">25 km</option>
          </select>
        </label>
        <label>
          {localization.near_ctrl_cat[lang]}
          <select value={category} onChange={(event) => setCategory(event.target.value as PlaceCategory | 'all')}>
            <option value="all">{localization.lbl_all[lang]}</option>
            {categories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
          </select>
        </label>
        <article>
          <strong>{placesWithDistance?.length}</strong>
          <span>{localization.near_ctrl_res[lang]} {radius} km</span>
        </article>
        <article>
          <strong>{visited.length}</strong>
          <span>{localization.near_ctrl_vis[lang]}</span>
        </article>
      </section>

      <p className="status-line">📍 {status}</p>

      <section className="nearby-list">
        {placesWithDistance?.map(({ place, placeLang, distanceKm }, index) => {
          const isVisited = visited.includes(place.slug);
          const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
          return (
            <article className={isVisited ? 'nearby-item visited' : 'nearby-item'} key={place.id}>
              <div className="nearby-rank">#{index + 1}</div>
              <div className="nearby-photo" style={{ backgroundImage: place.imageUrl ? `url(${place.imageUrl})` : undefined }} />
              <div className="nearby-content">
                <span className="eyebrow">{categoryEmoji[place.category]} {categoryLabels[place.category]}</span>
                <h2>{placeLang.name}</h2>
                <p>{placeLang.shortDescription}</p>
                <div className="nearby-meta">
                  <strong>{distanceKm.toFixed(distanceKm < 1 ? 2 : 1)} km</strong>
                  <span>{location.source === 'gps' ? localization.near_loc_user[lang] : localization.near_loc_city[lang]}</span>
                  {isVisited && <span className="visited-badge">{localization.near_badge_tick[lang]}</span>}
                </div>
              </div>
              <div className="nearby-actions">
                <button className="secondary" onClick={() => onOpenPlace(place)}>{localization.near_btn_det[lang]}</button>
                <a className="primary as-link" href={navigationUrl} target="_blank" rel="noreferrer">{localization.near_btn_nav[lang]}</a>
                <button className={isVisited ? 'favorite active' : 'favorite'} onClick={() => toggleVisited(place)}>
                  {isVisited ? localization.near_btn_vis[lang] : localization.near_btn_unvis[lang]}
                </button>
                <button className="secondary" onClick={onShowMap}>{localization.near_btn_map[lang]}</button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}
