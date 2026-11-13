import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { categoryEmoji, useCategoryLabels } from '../lib/labels';
import type { Place, PlaceLang, PlaceCategory, PlacesGroup } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface GalleryItem {
  id: string;
  place: Place;
  placeLang: PlaceLang;
  url: string;
  caption: string;
  sourceLabel: string;
  sourceUrl: string;
}

interface GalleryPageProps {
  onOpenPlace: (place: Place) => void;
}

export function GalleryPage({ onOpenPlace }: GalleryPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const categoryLabels = useCategoryLabels();

  const [places, setPlaces] = useState<PlacesGroup | null>(null);
  const [category, setCategory] = useState<PlaceCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  const categories = useMemo(() => {
    return Array.from(new Set(places?.pl.map((place) => place.category)));
  }, [places]);

  const galleryItems = useMemo<GalleryItem[]>(() => {
    if (isLoading || places == null) return [];

    return places.pl.flatMap((place, index) => {
      const placeLang = ((lang === "pl" || places?.en[index] == null) ? place : places.en[index])
      const photos = place.photos.length
        ? place.photos
        : place.imageUrl
          ? [{ url: place.imageUrl, caption: placeLang.name, sourceLabel: place.sourceLabel, sourceUrl: place.sourceUrl }]
          : [];

      return photos.map((photo, index) => ({
        id: `${place.id}-${photo.id ?? index}`,
        place,
        placeLang,
        url: photo.url,
        caption: photo.caption || placeLang.name,
        sourceLabel: photo.sourceLabel || place.sourceLabel,
        sourceUrl: photo.sourceUrl || place.sourceUrl
      }));
    });
  }, [places]);

  const visibleItems = useMemo(() => {
    if (isLoading || places == null) return [];

    const normalizedQuery = query.trim().toLowerCase();
    return galleryItems.filter((item) => {
      const { place } = item;

      const matchesCategory = category === 'all' || place.category === category;
      const matchesQuery =
        !normalizedQuery ||
        place.name.toLowerCase().includes(normalizedQuery) ||
        item.caption.toLowerCase().includes(normalizedQuery) ||
        place.shortDescription.toLowerCase().includes(normalizedQuery) ||
        place.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }, [galleryItems, category, query]);

  const selectedIndex = selected ? visibleItems.findIndex((item) => item.id === selected.id) : -1;

  function selectRelative(direction: -1 | 1) {
    if (!visibleItems.length) return;
    const safeIndex = selectedIndex === -1 ? 0 : selectedIndex;
    const nextIndex = (safeIndex + direction + visibleItems.length) % visibleItems.length;
    setSelected(visibleItems[nextIndex]);
  }

  return (
    <main className="page gallery-page">
      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.gall_eb[lang]}</span>
          <h1>{localization.gall_header[lang]}</h1>
          <p>
            {localization.gall_desc[lang]}
          </p>
        </div>
      </section>

      {!isLoading && (
        <>
          <div className="filter-list horizontal">
            <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>
              🖼️ {localization.lbl_all[lang]}
            </button>
            {categories.map((item) => (
              <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
                {categoryEmoji[item]} {categoryLabels[item]}
              </button>
            ))}
          </div>

          <div className="toolbar gallery-toolbar">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={localization.gall_search_pch[lang]}
              aria-label={localization.gall_search_lbl[lang]}
            />
            <span className="gallery-counter">{visibleItems.length} {localization.gall_imgs_sml[lang]}</span>
          </div>

          <section className="gallery-grid" aria-label={localization.gall_grid_lbl[lang]}>
            {visibleItems.map((item, index) => (
              <button
                key={item.id}
                className={index % 5 === 0 ? 'gallery-tile large' : 'gallery-tile'}
                onClick={() => setSelected(item)}
              >
                <img src={item.url} alt={item.caption} loading="lazy" />
                <span>
                  <strong>{item.placeLang.name}</strong>
                  <small>{categoryEmoji[item.place.category]} {categoryLabels[item.place.category]}</small>
                </span>
              </button>
            ))}
          </section>

          {selected && (
            <div className="dialog-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
              <section className="dialog gallery-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
                <button className="dialog-close" onClick={() => setSelected(null)} aria-label={localization.gall_dlg_close_lbl[lang]}>
                  ×
                </button>
                <div className="gallery-preview-wrap">
                  <button className="gallery-nav previous" onClick={() => selectRelative(-1)} aria-label={localization.gall_dlg_prev_lbl[lang]}>
                    ‹
                  </button>
                  <img src={selected.url} alt={selected.caption} />
                  <button className="gallery-nav next" onClick={() => selectRelative(1)} aria-label={localization.gall_dlg_next_lbl[lang]}>
                    ›
                  </button>
                </div>
                <div className="gallery-dialog-content">
                  <span className="eyebrow">{categoryLabels[selected.place.category]}</span>
                  <h2>{selected.placeLang.name}</h2>
                  <p>{selected.caption}</p>
                  <p>{selected.placeLang.shortDescription}</p>
                  <p className="muted">
                    {localization.gall_img_lrg[lang]} {selectedIndex + 1 > 0 ? selectedIndex + 1 : 1} {localization.gall_from[lang]} {visibleItems.length}.
                    {localization.gall_dlg_instr[lang]}
                  </p>
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                    {localization.gall_dlg_src[lang]} {selected.sourceLabel}
                  </a>
                  <div className="gallery-dialog-actions">
                    <button className="secondary" onClick={() => onOpenPlace(selected.place)}>
                      {localization.gall_dlg_dtl[lang]}
                    </button>
                    <button className="secondary" onClick={() => selectRelative(-1)}>
                      {localization.gall_dlg_prev[lang]}
                    </button>
                    <button className="primary" onClick={() => selectRelative(1)}>
                      {localization.gall_dlg_next[lang]}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      )}


    </main>
  );
}
