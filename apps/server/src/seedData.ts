import type { ItineraryInput, PlaceInput, PlacePhotoInput, RouteInput } from './types.js';

const wikiCiezkowice = 'https://pl.wikipedia.org/wiki/Ci%C4%99%C5%BCkowice';
const wikiSkamieniale = 'https://pl.wikipedia.org/wiki/Rezerwat_przyrody_Skamienia%C5%82e_Miasto';
const wikiKasna = 'https://pl.wikipedia.org/wiki/K%C4%85%C5%9Bna_Dolna';

export const seedPlaces: PlaceInput[] = [
  {
    slug: 'skamieniale-miasto',
    name: 'Rezerwat przyrody Skamieniałe Miasto',
    category: 'nature',
    shortDescription: 'Najbardziej rozpoznawalna atrakcja Ciężkowic — rezerwat z fantazyjnymi skałami piaskowcowymi.',
    description:
      'Skamieniałe Miasto to rezerwat przyrody nieożywionej położony na Pogórzu Ciężkowickim. Na obszarze rezerwatu znajdują się liczne ostańce piaskowcowe, m.in. Czarownica, Ratusz, Grunwald, Grzybek i Skałka z Krzyżem. Miejsce łączy walory przyrodnicze, krajobrazowe i edukacyjne.',
    latitude: 49.776389,
    longitude: 20.966667,
    address: 'Ciężkowice, okolice drogi wojewódzkiej nr 977',
    openingHours: 'teren dostępny sezonowo zgodnie z regulaminem rezerwatu',
    ticketInfo: 'informacje o biletach należy sprawdzić przed wizytą',
    website: 'https://muzeum.ciezkowice.pl/skamieniale-miasto/',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Skamienia%C5%82e_Miasto_a12.jpg/800px-Skamienia%C5%82e_Miasto_a12.jpg',
    sourceLabel: 'Wikipedia — Rezerwat przyrody Skamieniałe Miasto',
    sourceUrl: wikiSkamieniale,
    tags: ['skały', 'rezerwat', 'przyroda', 'szlak'],
    isFeatured: true,
    funFact: 'Nazwa rezerwatu wiąże się z legendą o mieście zamienionym w kamień za występne życie mieszkańców.'
  },
  {
    slug: 'wodospad-czarownic',
    name: 'Wąwóz Ciężkowicki i Wodospad Czarownic',
    category: 'nature',
    shortDescription: 'Malowniczy wąwóz w pobliżu Skamieniałego Miasta, zakończony wodospadem.',
    description:
      'Wąwóz Ciężkowicki, nazywany także Wąwozem Czarownic, stanowi naturalne uzupełnienie zwiedzania Skamieniałego Miasta. Według źródeł obiekt objęto ochroną jako pomnik przyrody „Wodospad”. Trasa jest atrakcyjna szczególnie dla osób zainteresowanych geologią i krajobrazem Pogórza.',
    latitude: 49.7779,
    longitude: 20.9785,
    address: 'okolice rezerwatu Skamieniałe Miasto, Ciężkowice',
    openingHours: 'teren dostępny sezonowo, zależnie od warunków pogodowych',
    ticketInfo: 'informacje lokalne do uzupełnienia',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/PL_-_Nature_reserve_Skamieniale_Miasto_-_Kroton_005.JPG/800px-PL_-_Nature_reserve_Skamieniale_Miasto_-_Kroton_005.JPG',
    sourceLabel: 'Wikipedia — Rezerwat przyrody Skamieniałe Miasto',
    sourceUrl: wikiSkamieniale,
    tags: ['wąwóz', 'wodospad', 'przyroda', 'spacer'],
    isFeatured: true,
    funFact: 'W pobliżu rezerwatu wymienia się jeden z najgłębszych wąwozów na polskim Pogórzu.'
  },
  {
    slug: 'muzeum-przyrodnicze',
    name: 'Muzeum Przyrodnicze im. Krystyny i Włodzimierza Tomków',
    category: 'museum',
    shortDescription: 'Muzeum prezentujące walory przyrodnicze Ziemi Ciężkowickiej.',
    description:
      'Muzeum Przyrodnicze w Ciężkowicach przybliża świat pogórzańskiej fauny i przyrody. Jest ważnym punktem edukacyjnym oraz dobrym uzupełnieniem zwiedzania Skamieniałego Miasta.',
    latitude: 49.7878,
    longitude: 20.9742,
    address: 'ul. 3-go Maja 34, 33-190 Ciężkowice',
    openingHours: 'pon.-czw. 8:00–16:00, pt. 8:00–18:00, sob.-niedz. 10:00–18:00 (wg strony muzeum)',
    ticketInfo: 'cennik do sprawdzenia na stronie muzeum',
    website: 'https://muzeum.ciezkowice.pl/',
    phone: '+48 14 67 67 664',
    imageUrl: 'https://muzeum.ciezkowice.pl/wp-content/uploads/2022/02/home_004.jpg',
    sourceLabel: 'Muzeum Przyrodnicze w Ciężkowicach — strona oficjalna',
    sourceUrl: 'https://muzeum.ciezkowice.pl/',
    tags: ['muzeum', 'edukacja', 'przyroda'],
    isFeatured: true,
    funFact: 'Muzeum działa jako centrum wiedzy o przyrodzie i legendach Pogórza Ciężkowickiego.'
  },
  {
    slug: 'rynek-ratusz',
    name: 'Rynek i ratusz w Ciężkowicach',
    category: 'monument',
    shortDescription: 'Historyczne centrum miasta z klasycystycznym ratuszem i dawną zabudową.',
    description:
      'Rynek w Ciężkowicach zachował historyczny układ urbanistyczny. W jego obrębie znajdują się obiekty ważne dla lokalnej tożsamości: ratusz, pomnik św. Floriana, ławka Paderewskiego oraz charakterystyczna zabudowa.',
    latitude: 49.786389,
    longitude: 20.974167,
    address: 'Rynek, 33-190 Ciężkowice',
    openingHours: 'przestrzeń publiczna',
    ticketInfo: 'bezpłatnie',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Ci%C4%99%C5%BCkowice%2C_ratusz_%28HB1%29.jpg/800px-Ci%C4%99%C5%BCkowice%2C_ratusz_%28HB1%29.jpg',
    sourceLabel: 'Wikipedia — Ciężkowice',
    sourceUrl: wikiCiezkowice,
    tags: ['rynek', 'ratusz', 'zabytek', 'spacer'],
    isFeatured: true,
    funFact: 'Ciężkowice uzyskały prawa miejskie w 1348 roku, utraciły je w 1934 roku i odzyskały w 1998 roku.'
  },
  {
    slug: 'kosciol-sw-andrzeja',
    name: 'Kościół św. Andrzeja Apostoła',
    category: 'monument',
    shortDescription: 'Neogotycki kościół związany z historią parafii i miasta.',
    description:
      'Kościół pw. Pana Jezusa Miłosiernego i św. Andrzeja Apostoła w Ciężkowicach jest ważnym zabytkiem sakralnym. Według źródeł obiekt z początku XX wieku zaprojektował Jan Sas-Zubrzycki.',
    latitude: 49.7869,
    longitude: 20.9735,
    address: 'okolice rynku, Ciężkowice',
    openingHours: 'według porządku parafii',
    ticketInfo: 'bezpłatnie',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Ci%C4%99%C5%BCkowice%2C_ko%C5%9Bci%C3%B3%C5%82_%C5%9Bw._Andrzeja_Aposto%C5%82a_%28HB1%29.jpg/800px-Ci%C4%99%C5%BCkowice%2C_ko%C5%9Bci%C3%B3%C5%82_%C5%9Bw._Andrzeja_Aposto%C5%82a_%28HB1%29.jpg',
    sourceLabel: 'Wikipedia — Ciężkowice',
    sourceUrl: wikiCiezkowice,
    tags: ['kościół', 'zabytek', 'sakralne'],
    isFeatured: false,
    funFact: 'W opisie turystycznym Ciężkowic świątynia jest wymieniana jako jeden z najciekawszych obiektów miasta.'
  },
  {
    slug: 'park-zdrojowy',
    name: 'Park Zdrojowy im. Zbigniewa Jurkiewicza',
    category: 'attraction',
    shortDescription: 'Nowoczesna przestrzeń rekreacyjna związana z wypoczynkiem i hydroterapią.',
    description:
      'Park Zdrojowy w Ciężkowicach to współczesna atrakcja rekreacyjna miasta. Według źródeł został otwarty w 2021 roku i wykorzystuje elementy hydroterapii inspirowanej metodą księdza Sebastiana Kneippa.',
    latitude: 49.7912,
    longitude: 20.9765,
    address: 'Ciężkowice',
    openingHours: 'przestrzeń rekreacyjna — godziny do weryfikacji',
    ticketInfo: 'do uzupełnienia',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Ci%C4%99%C5%BCkowice%2C_Park_Zdrojowy_%28HB1%29.jpg/800px-Ci%C4%99%C5%BCkowice%2C_Park_Zdrojowy_%28HB1%29.jpg',
    sourceLabel: 'Wikipedia — Ciężkowice',
    sourceUrl: wikiCiezkowice,
    tags: ['park', 'rekreacja', 'rodzina'],
    isFeatured: false,
    funFact: 'Park pokazuje, że przewodnik obejmuje nie tylko historię, ale też nowe inwestycje turystyczne.'
  },
  {
    slug: 'sciezka-w-koronach-drzew',
    name: 'Ścieżka w koronach drzew',
    category: 'attraction',
    shortDescription: 'Nowa atrakcja w przysiółku Rakutowa z trasą edukacyjną ponad poziomem terenu.',
    description:
      'Ścieżka edukacyjna w koronach drzew w Ciężkowicach została wskazana w źródłach jako atrakcja powstała w 2023 roku. To dobry punkt dla rodzin i osób chcących poznać przyrodę z innej perspektywy.',
    latitude: 49.7924,
    longitude: 20.992,
    address: 'Rakutowa, Ciężkowice',
    openingHours: 'godziny należy sprawdzić przed wizytą',
    ticketInfo: 'cennik do uzupełnienia',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Ci%C4%99%C5%BCkowice%2C_%C5%9Bcie%C5%BCka_w_koronach_drzew_%28HB3%29.jpg/800px-Ci%C4%99%C5%BCkowice%2C_%C5%9Bcie%C5%BCka_w_koronach_drzew_%28HB3%29.jpg',
    sourceLabel: 'Wikipedia — Ciężkowice',
    sourceUrl: wikiCiezkowice,
    tags: ['ścieżka', 'edukacja', 'przyroda', 'rodzina'],
    isFeatured: true,
    funFact: 'Według źródeł ścieżka ma ponad 1 km długości.'
  },
  {
    slug: 'dwor-paderewskiego-kasna-dolna',
    name: 'Dwór Ignacego Jana Paderewskiego w Kąśnej Dolnej',
    category: 'monument',
    shortDescription: 'Zespół dworski związany z Ignacym Janem Paderewskim.',
    description:
      'Dwór Paderewskiego w Kąśnej Dolnej to jedno z najważniejszych miejsc kultury w gminie Ciężkowice. W zespole dworskim działa muzeum i Centrum Paderewskiego, organizujące koncerty oraz wydarzenia muzyczne.',
    latitude: 49.781944,
    longitude: 20.945833,
    address: 'Kąśna Dolna 17, 33-190 Ciężkowice',
    openingHours: 'według informacji Centrum Paderewskiego',
    ticketInfo: 'bilety i zwiedzanie według strony Centrum',
    website: 'https://centrumpaderewskiego.pl/',
    phone: '+48 14 600 00 16',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/K%C4%85%C5%9Bna_Dolna%2C_dworek_Ignacego_Paderewskiego_%28HB3%29.jpg/800px-K%C4%85%C5%9Bna_Dolna%2C_dworek_Ignacego_Paderewskiego_%28HB3%29.jpg',
    sourceLabel: 'Centrum Paderewskiego w Kąśnej Dolnej — strona oficjalna',
    sourceUrl: 'https://centrumpaderewskiego.pl/',
    tags: ['Paderewski', 'muzyka', 'dwór', 'zabytek'],
    isFeatured: true,
    funFact: 'Centrum Paderewskiego organizuje m.in. koncerty i festiwale poświęcone muzyce klasycznej.'
  },
  {
    slug: 'cmentarz-wojenny-137',
    name: 'Cmentarz wojenny nr 137',
    category: 'history',
    shortDescription: 'Miejsce pamięci z okresu I wojny światowej.',
    description:
      'W okolicach Ciężkowic znajdują się cmentarze wojenne z okresu I wojny światowej. Cmentarz nr 137 jest jednym z obiektów przypominających o walkach toczonych w regionie w latach 1914–1915.',
    latitude: 49.7842,
    longitude: 20.9686,
    address: 'Ciężkowice',
    openingHours: 'teren pamięci — dostęp do weryfikacji lokalnej',
    ticketInfo: 'bezpłatnie',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Ci%C4%99%C5%BCkowice%2C_cmentarz_wojenny_nr_137_%28HB2%29.jpg/800px-Ci%C4%99%C5%BCkowice%2C_cmentarz_wojenny_nr_137_%28HB2%29.jpg',
    sourceLabel: 'Wikipedia — Ciężkowice',
    sourceUrl: wikiCiezkowice,
    tags: ['historia', 'I wojna światowa', 'pamięć'],
    isFeatured: false,
    funFact: 'W źródłach wymieniono kilka cmentarzy wojennych w gminie: nr 137, 138, 139, 140 i 141.'
  },
  {
    slug: 'maestro-cafe',
    name: 'Kawiarnia Maestro',
    category: 'restaurant',
    shortDescription: 'Kawiarnia działająca przy Centrum Paderewskiego w Kąśnej Dolnej.',
    description:
      'Kawiarnia Maestro jest elementem oferty Centrum Paderewskiego. W aplikacji pełni przykładowy rekord kategorii gastronomicznej, który można później rozszerzyć o lokalne restauracje z Ciężkowic.',
    latitude: 49.78195,
    longitude: 20.9459,
    address: 'Kąśna Dolna 17, 33-190 Ciężkowice',
    openingHours: 'według informacji Centrum Paderewskiego',
    ticketInfo: 'nie dotyczy',
    website: 'https://centrumpaderewskiego.pl/kawiarnia-maestro.html',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    sourceLabel: 'Centrum Paderewskiego — Kawiarnia Maestro',
    sourceUrl: 'https://centrumpaderewskiego.pl/kawiarnia-maestro.html',
    tags: ['kawiarnia', 'gastronomia', 'Paderewski'],
    isFeatured: false,
    funFact: 'To miejsce dobrze pasuje jako przerwa podczas zwiedzania dworku i parku.'
  },
  {
    slug: 'noclegi-centrum-paderewskiego',
    name: 'Noclegi w Centrum Paderewskiego',
    category: 'lodging',
    shortDescription: 'Przykład bazy noclegowej w gminie Ciężkowice.',
    description:
      'Centrum Paderewskiego udostępnia informacje o noclegach w ramach Domu Pracy Twórczej. Rekord pokazuje, jak aplikacja będzie prezentować miejsca noclegowe razem z danymi kontaktowymi i źródłami.',
    latitude: 49.7821,
    longitude: 20.9457,
    address: 'Kąśna Dolna 17, 33-190 Ciężkowice',
    openingHours: 'rezerwacja według zasad obiektu',
    ticketInfo: 'ceny do sprawdzenia na stronie obiektu',
    website: 'https://centrumpaderewskiego.pl/noclegi.html',
    phone: '+48 14 600 00 16',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    sourceLabel: 'Centrum Paderewskiego — Noclegi',
    sourceUrl: 'https://centrumpaderewskiego.pl/noclegi.html',
    tags: ['nocleg', 'Kąśna Dolna', 'turystyka'],
    isFeatured: false,
    funFact: 'W dalszym etapie można dodać agroturystyki i pensjonaty z całej gminy.'
  }
];

export const seedPlacePhotos: Array<{ placeSlug: string; photos: PlacePhotoInput[] }> = seedPlaces.map((place) => ({
  placeSlug: place.slug,
  photos: [
    {
      url: place.imageUrl ?? 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      caption: place.name,
      sourceLabel: place.sourceLabel,
      sourceUrl: place.sourceUrl,
      isMain: true
    }
  ]
}));

export const seedRoutes: RouteInput[] = [
  {
    slug: 'trasa-rynek-skamieniale-miasto',
    title: 'Spacer: rynek — Muzeum — Skamieniałe Miasto',
    type: 'walking',
    distanceKm: 4.2,
    duration: '2,5–3,5 godziny',
    difficulty: 'łatwa',
    description:
      'Propozycja krótkiego spaceru łączącego centrum Ciężkowic, Muzeum Przyrodnicze i rezerwat Skamieniałe Miasto. Trasa jest dobra jako podstawa wycieczki 1-dniowej.',
    points: [
      { name: 'Rynek i ratusz', latitude: 49.786389, longitude: 20.974167 },
      { name: 'Muzeum Przyrodnicze', latitude: 49.7878, longitude: 20.9742 },
      { name: 'Skamieniałe Miasto', latitude: 49.776389, longitude: 20.966667 },
      { name: 'Wodospad Czarownic', latitude: 49.7779, longitude: 20.9785 }
    ],
    sourceLabel: 'Wikipedia — Ciężkowice / Skamieniałe Miasto',
    sourceUrl: wikiCiezkowice
  },
  {
    slug: 'trasa-kultura-paderewski',
    title: 'Szlak kultury: Ciężkowice — Kąśna Dolna',
    type: 'trail',
    distanceKm: 7.5,
    duration: 'pół dnia',
    difficulty: 'średnia',
    description:
      'Trasa łącząca centrum Ciężkowic z Kąśną Dolną i Dworem Ignacego Jana Paderewskiego. Dobra propozycja na drugi dzień zwiedzania.',
    points: [
      { name: 'Rynek w Ciężkowicach', latitude: 49.786389, longitude: 20.974167 },
      { name: 'Park Zdrojowy', latitude: 49.7912, longitude: 20.9765 },
      { name: 'Dwór Paderewskiego', latitude: 49.781944, longitude: 20.945833 }
    ],
    sourceLabel: 'Centrum Paderewskiego / Wikipedia — Kąśna Dolna',
    sourceUrl: 'https://centrumpaderewskiego.pl/'
  }
];

export const seedItineraries: ItineraryInput[] = [
  {
    slug: 'wycieczka-1-dniowa',
    title: 'Wycieczka 1-dniowa po Ciężkowicach',
    type: 'one_day',
    description: 'Plan dla osoby, która chce w jeden dzień zobaczyć najważniejsze atrakcje miasta i okolicy.',
    days: [
      {
        day: 1,
        title: 'Ciężkowice w pigułce',
        summary: 'Rynek, muzeum, Skamieniałe Miasto, Wodospad Czarownic i odpoczynek w parku.',
        items: [
          { time: '09:00', title: 'Start na rynku', description: 'Krótki spacer po centrum, ratusz i zabudowa rynku.', placeSlug: 'rynek-ratusz' },
          { time: '10:00', title: 'Muzeum Przyrodnicze', description: 'Wprowadzenie do przyrody Pogórza Ciężkowickiego.', placeSlug: 'muzeum-przyrodnicze' },
          { time: '12:00', title: 'Skamieniałe Miasto', description: 'Przejście przez najważniejsze formacje skalne.', placeSlug: 'skamieniale-miasto' },
          { time: '14:30', title: 'Wąwóz i Wodospad Czarownic', description: 'Krótka trasa przyrodnicza po rezerwacie.', placeSlug: 'wodospad-czarownic' },
          { time: '16:00', title: 'Park Zdrojowy', description: 'Odpoczynek i zakończenie zwiedzania.', placeSlug: 'park-zdrojowy' }
        ]
      }
    ]
  },
  {
    slug: 'wycieczka-2-dniowa',
    title: 'Wycieczka 2-dniowa: przyroda i kultura',
    type: 'two_day',
    description: 'Plan rozbudowany o Kąśną Dolną, Dwór Paderewskiego i ścieżkę w koronach drzew.',
    days: [
      {
        day: 1,
        title: 'Przyroda Ciężkowic',
        summary: 'Dzień przeznaczony na centrum miasta, muzeum i Skamieniałe Miasto.',
        items: [
          { time: '09:00', title: 'Rynek i ratusz', description: 'Wprowadzenie historyczne do miasta.', placeSlug: 'rynek-ratusz' },
          { time: '10:00', title: 'Muzeum Przyrodnicze', description: 'Poznanie przyrody regionu.', placeSlug: 'muzeum-przyrodnicze' },
          { time: '12:00', title: 'Skamieniałe Miasto', description: 'Najważniejszy punkt przyrodniczy aplikacji.', placeSlug: 'skamieniale-miasto' },
          { time: '15:00', title: 'Wodospad Czarownic', description: 'Uzupełnienie trasy przyrodniczej.', placeSlug: 'wodospad-czarownic' }
        ]
      },
      {
        day: 2,
        title: 'Kultura i rekreacja',
        summary: 'Dzień związany z Paderewskim, rekreacją i współczesnymi atrakcjami.',
        items: [
          { time: '09:30', title: 'Dwór Paderewskiego', description: 'Zwiedzanie miejsca związanego z kompozytorem.', placeSlug: 'dwor-paderewskiego-kasna-dolna' },
          { time: '12:00', title: 'Kawiarnia Maestro', description: 'Przerwa kawowa przy Centrum Paderewskiego.', placeSlug: 'maestro-cafe' },
          { time: '14:00', title: 'Ścieżka w koronach drzew', description: 'Nowoczesna atrakcja edukacyjna.', placeSlug: 'sciezka-w-koronach-drzew' },
          { time: '16:30', title: 'Park Zdrojowy', description: 'Zakończenie wyjazdu spacerem rekreacyjnym.', placeSlug: 'park-zdrojowy' }
        ]
      }
    ]
  }
];
