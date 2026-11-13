import type { AppSettings, AuthResult, CategoryStat, Itinerary, Place, SourceItem, Stats, TouristRoute, RoutesLang, User, ItinerariesGroup, PlaceGroup, PlacesGroup, RouteGroup, ItineraryGroup } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(token)
  });
  return parseResponse<T>(response);
}

export async function apiSend<T>(path: string, method: string, body?: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return parseResponse<T>(response);
}

export const api = {
  places: (params?: { q?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    const suffix = query.toString() ? `?${query}` : '';
    return apiGet<PlacesGroup>(`/places${suffix}`); //.
  },
  place: (slug: string) => apiGet<PlaceGroup>(`/places/${slug}`), //.
  categories: () => apiGet<CategoryStat[]>('/categories'),
  routes: () => apiGet<RoutesLang>('/routes'),
  itineraries: () => apiGet<ItinerariesGroup>('/itineraries'),
  stats: () => apiGet<Stats>('/stats'),
  sources: () => apiGet<SourceItem[]>('/sources'),
  settings: () => apiGet<AppSettings>('/settings'),
  login: (email: string, password: string) => apiSend<AuthResult>('/auth/login', 'POST', { email, password }),
  register: (email: string, password: string) => apiSend<AuthResult>('/auth/register', 'POST', { email, password }),
  me: (token: string) => apiGet<User>('/me', token),
  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    apiSend<{ message: string }>('/me/password', 'PUT', { currentPassword, newPassword }, token),
  saveSearch: (query: string, token?: string) => apiSend<void>('/search-history', 'POST', { query }, token),
  favorites: (token: string) => apiGet<PlacesGroup>('/me/favorites', token), //.
  addFavorite: (placeId: number, token: string) => apiSend<void>(`/me/favorites/${placeId}`, 'POST', undefined, token),
  removeFavorite: (placeId: number, token: string) => apiSend<void>(`/me/favorites/${placeId}`, 'DELETE', undefined, token),
  searchHistory: (token: string) => apiGet<Array<{ id: number; query: string; createdAt: string }>>('/me/search-history', token),
  adminDashboard: (token: string) =>
    apiGet<{ places: number; routes: number; itineraries: number; users: number; searches: number; favorites: number }>('/admin/dashboard', token),
  adminUsers: (token: string) => apiGet<User[]>('/admin/users', token),
  adminCreateUser: (payload: { email: string; password: string; role: User['role'] }, token: string) => apiSend<User>('/admin/users', 'POST', payload, token),
  adminUpdateUserRole: (id: number, role: User['role'], token: string) => apiSend<User>(`/admin/users/${id}/role`, 'PUT', { role }, token),
  adminResetUserPassword: (id: number, password: string, token: string) => apiSend<{ message: string }>(`/admin/users/${id}/password`, 'PUT', { password }, token),
  adminDeleteUser: (id: number, token: string) => apiSend<void>(`/admin/users/${id}`, 'DELETE', undefined, token),
  adminCreatePlace: (place: Partial<PlaceGroup>, token: string) => apiSend<PlaceGroup>('/admin/places', 'POST', place, token),
  adminUpdatePlace: (id: number, place: Partial<PlaceGroup>, token: string) => apiSend<PlaceGroup>(`/admin/places/${id}`, 'PUT', place, token),
  adminDeletePlace: (id: number, token: string) => apiSend<void>(`/admin/places/${id}`, 'DELETE', undefined, token),
  adminCreateRoute: (route: Partial<RouteGroup>, token: string) => apiSend<RouteGroup>('/admin/routes', 'POST', route, token),
  adminUpdateRoute: (id: number, route: Partial<RouteGroup>, token: string) => apiSend<RouteGroup>(`/admin/routes/${id}`, 'PUT', route, token),
  adminDeleteRoute: (id: number, token: string) => apiSend<void>(`/admin/routes/${id}`, 'DELETE', undefined, token),
  adminCreateItinerary: (itinerary: Partial<ItineraryGroup>, token: string) => apiSend<ItineraryGroup>('/admin/itineraries', 'POST', itinerary, token),
  adminUpdateItinerary: (id: number, itinerary: Partial<ItineraryGroup>, token: string) =>
    apiSend<ItineraryGroup>(`/admin/itineraries/${id}`, 'PUT', itinerary, token),
  adminDeleteItinerary: (id: number, token: string) => apiSend<void>(`/admin/itineraries/${id}`, 'DELETE', undefined, token),
  adminUpdateSettings: (settings: AppSettings, token: string) => apiSend<AppSettings>('/admin/settings', 'PUT', settings, token)
};

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new Error(data?.message ?? 'Wystąpił błąd komunikacji z API.');
  }
  return data as T;
}
