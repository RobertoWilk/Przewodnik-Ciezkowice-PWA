# Przewodnik w formie aplikacji mobilnej „Ciężkowice”

*Autor: Robert Wilk*

 Aplikacja jest responsywną aplikacją PWA działającą na telefonie, tablecie i komputerze.

## Zakres funkcjonalny

- mapa interaktywna z atrakcjami, zabytkami, restauracjami, noclegami i szlakami,
- lokalizacja użytkownika na mapie,
- katalog miejsc z wyszukiwarką i filtrami,
- opis wycieczki 1-dniowej i 2-dniowej,
- historia i ciekawostki o Ciężkowicach,
- konta użytkowników: ulubione miejsca i historia wyszukiwań,
- panel administratora do aktualizacji danych.


## Uruchomienie

Wymagania: **Node.js 22+**.

Jeśli Node.js nie jest zainstalowany:

1. Wejdź na https://nodejs.org/
2. Pobierz instalator dla Windows.
3. Zainstaluj z domyślnymi opcjami, zostawiając zaznaczone dodanie do PATH.
4. Otwórz terminal i sprawdź:

```bash
node --version
npm --version
```
UWAGA: Przed uruchomieniem projektu należy pobrać plik bazy danych SQLite i włożyć do folderu `./apps/server/data`.
[Link do pliku .sqlite](https://drive.google.com/file/d/1yqniz1r1CtKiqhxq2g2HSAlDLpKza4Ns/view?usp=sharing)


Najprościej uruchomić projekt dwuklikiem w `uruchom.bat`.

Ręczne uruchomienie:

```bash
npm install
npm run seed
npm run dev
```

## Wariant uniwersalny

Dla zwykłego turysty najlepszym wariantem docelowym jest publiczne wdrożenie jako PWA na hostingu. Wtedy użytkownik otwiera link w telefonie i dodaje aplikację do ekranu głównego — bez instalowania Node.js. Wariant lokalny z Node.js jest przeznaczony do prezentacji projektu, testów i pracy dyplomowej.

Adresy lokalne:

- frontend: http://localhost:5173
- backend API: http://localhost:4000/api/health

Domyślne konto administratora:

- e-mail: `admin@ciezkowice.local`
- hasło: `admin123`

Awaryjny reset hasła administratora:

```bash
npm run admin:reset-password -- admin@ciezkowice.local nowehaslo123
```

Na Windows można też użyć pliku:

`reset_hasla_admina.bat`

## Struktura

```text
apps/client/      aplikacja React PWA
apps/server/      API Express + SQLite
```

## Źródła danych startowych

Dane początkowe są przykładami edukacyjnymi opartymi na publicznych źródłach wskazanych przy rekordach w bazie. Przed oddaniem pracy należy zweryfikować treści i uzupełnić zdjęcia materiałami własnymi lub legalnie pozyskanymi.
