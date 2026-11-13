const visitedKey = 'ciezkowice.visitedPlaces';

export function getVisitedSlugs(): string[] {
  try {
    const raw = localStorage.getItem(visitedKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveVisitedSlugs(slugs: string[]) {
  localStorage.setItem(visitedKey, JSON.stringify(Array.from(new Set(slugs))));
}

export function toggleVisitedSlug(slug: string) {
  const visited = getVisitedSlugs();
  const next = visited.includes(slug) ? visited.filter((item) => item !== slug) : [...visited, slug];
  saveVisitedSlugs(next);
  return next;
}
