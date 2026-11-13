import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { api } from '../lib/api';
import { categoryEmoji, useCategoryLabels } from '../lib/labels';
import type { CategoryStat, Place, PlaceCategory, PlacesGroup, RoutesLang, TouristRoute } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface MapPageProps {
  token?: string;
}

const center: L.LatLngExpression = [49.786389, 20.974167];

export function MapPage({ token }: MapPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const categoryLabels = useCategoryLabels();

  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const routesLayer = useRef<L.LayerGroup | null>(null);
  const userLayer = useRef<L.LayerGroup | null>(null);

  const [places, setPlaces] = useState<PlacesGroup | null>(null);
  const [routes, setRoutes] = useState<RoutesLang | null>(null);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [category, setCategory] = useState<PlaceCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(localization.nav_state_ready[lang]);

  const [areRoutesLoading, setAreRoutesLoading] = useState(true);
  const [arePlacesLoading, setArePlacesLoading] = useState(true);

  useEffect(() => {
    api.categories().then(setCategories).catch(console.error);
    
    const fetchRoutes = async () => {
      try {
        // Wywołanie API i ustawienie stanu po sukcesie
        const data: RoutesLang = await api.routes(); 
        setRoutes(data);
      } catch (error) {
        console.error("Błąd pobierania danych tras:", error);
        setRoutes(null); // Ustawiamy null w przypadku błędu
      } finally {
        setAreRoutesLoading(false); // Zawsze ustawiamy isLoading na false
      }
    };

    fetchRoutes();
  }, []);

  useEffect(() => {
    //api.places({ q: query, category }).then(setPlaces).catch(console.error);

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
  }, [category]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = L.map(mapElement.current, {
      center,
      zoom: 13,
      minZoom: 11,
      maxZoom: 18
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    markersLayer.current = L.layerGroup().addTo(map);
    routesLayer.current = L.layerGroup().addTo(map);
    userLayer.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayer.current || !routesLayer.current) return;
    markersLayer.current.clearLayers();
    routesLayer.current.clearLayers();

    if (arePlacesLoading || !places) {
      return;
    }

    places.pl.forEach((place, index) => {
      const placeEn = places.en[index];
      const placeLang = (lang === "pl" ? place : placeEn)
      
      const marker = L.marker([place.latitude, place.longitude], { icon: markerFor(place.category) });
      marker.bindPopup(`
        <strong>${placeLang.name}</strong><br />
        ${placeLang.shortDescription}<br />
        <small>${categoryLabels[place.category]}</small>
      `);
      marker.addTo(markersLayer.current!);
    });

    
    if (areRoutesLoading || !routes) {
      return;
    }

    if (!routes.pl) {
      console.log("Brakuje danych dla języka polskiego.");
      return;
    }

    if (!routes.en) {
      console.log("Brakuje danych dla języka angielskiego.");
      return;
    }
      

    routes.pl.forEach((route, index) => {
      const route_lang = (lang == "pl" ? route : routes.en[index])
      const latLngs = route.points.map((point) => [point.latitude, point.longitude] as [number, number]);
      const line = L.polyline(latLngs, {
        color: index % 2 === 0 ? '#2d6a4f' : '#d08c3c',
        weight: 5,
        opacity: 0.78
      });
      line.bindPopup(`<strong>${route_lang.title}</strong><br />${route.distanceKm} km • ${route_lang.duration}`);
      line.addTo(routesLayer.current!);
    });

    const group = L.featureGroup([...markersLayer.current.getLayers(), ...routesLayer.current.getLayers()]);
    if (group.getLayers().length) mapRef.current.fitBounds(group.getBounds().pad(0.2));
  }, [places, arePlacesLoading, routes, areRoutesLoading]);

  const categoryOptions = useMemo(() => [{ category: 'all' as const, label: localization.lbl_all[lang], count: 0 }, ...categories], [categories]);

  async function search(event: FormEvent) {
    event.preventDefault();
    const results = await api.places({ q: query, category });
    setPlaces(results);
    if (query.trim()) await api.saveSearch(query.trim(), token).catch(() => undefined);
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setStatus(localization.nav_state_unsup[lang]);
      return;
    }
    setStatus(localization.nav_state_load[lang]);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latLng: L.LatLngExpression = [position.coords.latitude, position.coords.longitude];
        userLayer.current?.clearLayers();
        L.marker(latLng, {
          icon: L.divIcon({ className: 'user-location-marker', html: '<span>📍</span>', iconSize: [34, 34] })
        })
          .bindPopup(localization.nav_popup_loc[lang])
          .addTo(userLayer.current!);
        mapRef.current?.setView(latLng, 15);
        setStatus(localization.nav_state_usrloc[lang]);
      },
      () => setStatus(localization.nav_state_noperm[lang])
    );
  }

  return (
    <main className="map-page">
      <aside className="map-panel">
        <span className="eyebrow">{localization.map_eb[lang]}</span>
        <h1>{localization.map_header[lang]}</h1>
        <form className="map-search" onSubmit={search}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={localization.map_search_pch[lang]} />
          <button className="primary">{localization.map_search[lang]}</button>
        </form>
        <div className="filter-list">
          {categoryOptions.map((item) => (
            <button
              key={item.category}
              className={category === item.category ? 'active' : ''}
              onClick={() => setCategory(item.category)}
            >
              {item.category === 'all' ? '🗺️' : categoryEmoji[item.category]} {categoryLabels[item.category]}
            </button>
          ))}
        </div>
        <button className="secondary wide" onClick={locateUser}>
          {localization.map_show_gps[lang]}
        </button>
        <p className="status-line">{status}</p>
        <div className="mini-list">
          <strong>{localization.map_vis_places[lang]}: {places?.pl.length}</strong>
          {places?.pl.slice(0, 6).map((place, index) => {
            const placeEn = places.en[index];
            const placeLang = (lang === "pl" ? place : placeEn)
            return (
              <button key={place.id} onClick={() => mapRef.current?.setView([place.latitude, place.longitude], 16)}>
                {categoryEmoji[place.category]} {placeLang.name}
              </button>
            )
          })}
        </div>
      </aside>
      <section className="map-shell">
        <div ref={mapElement} className="map-container" />
      </section>
    </main>
  );
}

function markerFor(category: PlaceCategory) {
  return L.divIcon({
    className: `category-marker marker-${category}`,
    html: `<span>${categoryEmoji[category]}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}
