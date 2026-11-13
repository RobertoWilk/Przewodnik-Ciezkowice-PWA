import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { categoryEmoji, useCategoryLabels } from '../lib/labels';
import type { Place, PlacesGroup } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface PlannerPageProps {
  onOpenPlace: (place: Place) => void;
}

interface PlanItem {
  id: string;
  placeSlug: string;
  day: 1 | 2;
  note: string;
}

const plannerKey = 'ciezkowice.customPlanner';

export function PlannerPage({ onOpenPlace }: PlannerPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const categoryLabels = useCategoryLabels();

  const [places, setPlaces] = useState<PlacesGroup | null>(null);
  const [query, setQuery] = useState('');
  const [day, setDay] = useState<1 | 2>(1);
  const [note, setNote] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [plan, setPlan] = useState<PlanItem[]>(() => loadPlan());

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const data = await api.places();
        setPlaces(data);
        setSelectedSlug((current) => current || data.pl[0]?.slug || '');
      } catch (error) {
        console.error("Błąd pobierania danych miejsc:", error);
        setPlaces(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  useEffect(() => {
    localStorage.setItem(plannerKey, JSON.stringify(plan));
  }, [plan]);

  const placeBySlug = useMemo(() => new Map(places?.pl.map((place) => [place.slug, place])), [places]);

  const placeLangBySlug = useMemo(() => new Map(places?.pl.map((place, index) => {
    const placeEn = places.en[index];
    const placeLang = (lang === "pl" ? place : placeEn);
    return [place.slug, placeLang];
  })), [places]);

  const filteredPlaces = useMemo(() => {
    if (isLoading || !places) return [];
    const value = query.trim().toLowerCase();
    if (!value) return places.pl;
    return places.pl.filter((place) => (
      place.name.toLowerCase().includes(value) ||
      place.shortDescription.toLowerCase().includes(value) ||
      place.tags.some((tag) => tag.toLowerCase().includes(value))
    ));
  }, [places, query]);

  const selectedPlace = placeBySlug.get(selectedSlug);
  const selectedPlaceLang = placeLangBySlug.get(selectedSlug);

  function addToPlan(event: FormEvent) {
    event.preventDefault();
    if (!selectedSlug) return;
    const place = placeBySlug.get(selectedSlug);
    setPlan((current) => [
      ...current,
      {
        id: `${Date.now()}-${selectedSlug}`,
        placeSlug: selectedSlug,
        day,
        note: note.trim() || (place ? `Zwiedzanie: ${place.name}` : '')
      }
    ]);
    setNote('');
  }

  function removeItem(id: string) {
    setPlan((current) => current.filter((item) => item.id !== id));
  }

  function moveItem(id: string, direction: -1 | 1) {
    setPlan((current) => {
      const index = current.findIndex((item) => item.id === id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function clearPlan() {
    const ok = window.confirm(localization.plnr_clear_lg[lang]);
    if (ok) setPlan([]);
  }

  return (
    <main className="page planner-page">
      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.plnr_eb[lang]}</span>
          <h1>{localization.plnr_header[lang]}</h1>
          <p>{localization.plnr_desc[lang]}</p>
        </div>
        <div className="card-actions">
          <button className="secondary" onClick={() => window.print()}>{localization.plnr_print[lang]}</button>
          <button className="danger" onClick={clearPlan}>{localization.plnr_clear[lang]}</button>
        </div>
      </section>

      <section className="planner-layout">
        <form className="admin-form planner-form" onSubmit={addToPlan}>
          <h2>{localization.plnr_add_pnt[lang]}</h2>
          <label>
            {localization.plnr_search[lang]}
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={localization.plnr_search_pch[lang]} />
          </label>
          <label>
            {localization.plnr_place[lang]}
            <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)}>
              {filteredPlaces.map((place) => {
                if (isLoading || !places) return null;
                const placeEn = places.en.filter((place_en) => place_en.id === place.id)[0];
                const placeLang = (lang === "pl" ? place : placeEn);
                return <option key={place.slug} value={place.slug}>{placeLang.name}</option>
              })}
            </select>
          </label>
          <div className="form-grid two">
            <label>
              {localization.plnr_day[lang]}
              <select value={day} onChange={(event) => setDay(Number(event.target.value) as 1 | 2)}>
                <option value={1}>{localization.plnr_day[lang]} 1</option>
                <option value={2}>{localization.plnr_day[lang]} 2</option>
              </select>
            </label>
            <label>
              {localization.plnr_notes[lang]}
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={localization.plnr_notes_pch[lang]} />
            </label>
          </div>
          {selectedPlace && (
            <article className="planner-preview">
              <span>{categoryEmoji[selectedPlace.category]} {categoryLabels[selectedPlace.category]}</span>
              <strong>{selectedPlaceLang?.name}</strong>
              <p>{selectedPlaceLang?.shortDescription}</p>
            </article>
          )}
          <button className="primary">{localization.plnr_add_cta[lang]}</button>
        </form>

        <section className="planner-board">
          {[1, 2].map((currentDay) => (
            <article className="planner-day" key={currentDay}>
              <span className="day-label">{localization.plnr_day[lang]} {currentDay}</span>
              <h2>{currentDay === 1 ? localization.plnr_brd_day1[lang] : localization.plnr_brd_day2[lang]}</h2>
              <ol className="planner-list">
                {plan.filter((item) => item.day === currentDay).map((item) => {
                  const place = placeBySlug.get(item.placeSlug);
                  const placeLang = placeLangBySlug.get(item.placeSlug);
                  if (!place || !placeLang) return null;
                  return (
                    <li key={item.id}>
                      <div>
                        <strong>{placeLang.name}</strong>
                        <span>{item.note}</span>
                        <small>{categoryEmoji[place.category]} {categoryLabels[place.category]}</small>
                      </div>
                      <div className="planner-actions">
                        <button className="secondary" onClick={() => onOpenPlace(place)}>{localization.plnr_brd_det[lang]}</button>
                        <button className="secondary" onClick={() => moveItem(item.id, -1)}>↑</button>
                        <button className="secondary" onClick={() => moveItem(item.id, 1)}>↓</button>
                        <button className="danger" onClick={() => removeItem(item.id)}>{localization.plnr_brd_del[lang]}</button>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {!plan.some((item) => item.day === currentDay) && <p className="muted">{localization.plnr_brd_empty[lang]}</p>}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function loadPlan(): PlanItem[] {
  try {
    const raw = localStorage.getItem(plannerKey);
    return raw ? JSON.parse(raw) as PlanItem[] : [];
  } catch {
    return [];
  }
}
