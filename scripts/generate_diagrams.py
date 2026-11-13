from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

GREEN = "#1b4332"
GREEN2 = "#2d6a4f"
MINT = "#d8f3dc"
GOLD = "#d08c3c"
SAND = "#f7f5ee"
INK = "#18352a"
LINE = "#b8d8c0"
WHITE = "#ffffff"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


FONT_TITLE = font(34, True)
FONT_H = font(24, True)
FONT = font(19)
FONT_SMALL = font(15)


def text_center(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, fill=INK, fnt=FONT) -> None:
    lines = wrap_text(draw, text, fnt, box[2] - box[0] - 24)
    line_h = int(fnt.size * 1.25) if hasattr(fnt, "size") else 20
    total_h = line_h * len(lines)
    y = box[1] + ((box[3] - box[1]) - total_h) // 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=fnt)
        x = box[0] + ((box[2] - box[0]) - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), line, font=fnt, fill=fill)
        y += line_h


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=fnt)
        if bbox[2] - bbox[0] <= width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def rounded_box(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], title: str, body: str = "", fill=WHITE) -> None:
    draw.rounded_rectangle(box, radius=28, fill=fill, outline=LINE, width=3)
    x1, y1, x2, y2 = box
    draw.text((x1 + 22, y1 + 18), title, font=FONT_H, fill=GREEN)
    if body:
        y = y1 + 58
        for line in wrap_text(draw, body, FONT, x2 - x1 - 44):
            draw.text((x1 + 22, y), line, font=FONT, fill=INK)
            y += 26


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color=GREEN2) -> None:
    draw.line([start, end], fill=color, width=4)
    ex, ey = end
    sx, sy = start
    if ex >= sx:
        points = [(ex, ey), (ex - 14, ey - 8), (ex - 14, ey + 8)]
    else:
        points = [(ex, ey), (ex + 14, ey - 8), (ex + 14, ey + 8)]
    draw.polygon(points, fill=color)


def save(img: Image.Image, name: str) -> None:
    path = ASSETS / name
    img.save(path)
    print(f"Wygenerowano {path}")


def architecture() -> None:
    img = Image.new("RGB", (1600, 900), SAND)
    d = ImageDraw.Draw(img)
    d.text((70, 55), "Schemat architektury systemu", font=FONT_TITLE, fill=GREEN)
    boxes = {
        "u": (80, 270, 360, 470),
        "f": (480, 210, 810, 530),
        "api": (930, 210, 1260, 530),
        "db": (1360, 270, 1540, 470),
    }
    rounded_box(d, boxes["u"], "Użytkownik", "Telefon, tablet lub komputer")
    rounded_box(d, boxes["f"], "Frontend PWA", "React, TypeScript, Vite, widoki aplikacji, PWA")
    rounded_box(d, boxes["api"], "Backend API", "Node.js, Express, REST API, JWT, logika aplikacji")
    rounded_box(d, boxes["db"], "SQLite", "Dane miejsc, zdjęć, tras i użytkowników")
    arrow(d, (360, 370), (480, 370))
    arrow(d, (810, 370), (930, 370))
    arrow(d, (1260, 370), (1360, 370))
    rounded_box(d, (480, 610, 810, 760), "Leaflet + OSM", "Mapa, markery, trasy, lokalizacja", fill="#eef8ef")
    arrow(d, (640, 530), (640, 610))
    rounded_box(d, (930, 610, 1260, 760), "Zabezpieczenia", "JWT, bcryptjs, nagłówki HTTP, limit logowań", fill="#fff8ef")
    arrow(d, (1095, 530), (1095, 610))
    save(img, "rys_3_1_architektura_systemu.png")


def erd() -> None:
    img = Image.new("RGB", (1800, 1100), SAND)
    d = ImageDraw.Draw(img)
    d.text((70, 45), "Diagram związków encji bazy danych", font=FONT_TITLE, fill=GREEN)
    entities = {
        "users": (70, 170, 380, 410, "users", "id PK\nemail UK\npassword_hash\nrole"),
        "favorites": (520, 220, 820, 380, "favorites", "user_id FK\nplace_id FK"),
        "places": (960, 140, 1310, 460, "places", "id PK\nslug UK\nname\ncategory\nlatitude, longitude\nsource_url"),
        "photos": (1430, 180, 1730, 430, "place_photos", "id PK\nplace_id FK\nurl\ncaption\nis_main"),
        "history": (70, 620, 380, 820, "search_history", "id PK\nuser_id FK\nquery\ncreated_at"),
        "routes": (520, 620, 820, 840, "routes", "id PK\nslug UK\ntitle\ndistance_km\npoints_json"),
        "it": (960, 620, 1310, 840, "itineraries", "id PK\nslug UK\ntitle\ntype\ndays_json"),
        "set": (1430, 650, 1730, 820, "app_settings", "key PK\nvalue"),
    }
    for box in entities.values():
        x1, y1, x2, y2, title, body = box
        rounded_box(d, (x1, y1, x2, y2), title, body.replace("\n", " • "))
    arrow(d, (380, 290), (520, 290))
    arrow(d, (820, 300), (960, 300))
    arrow(d, (1310, 300), (1430, 300))
    arrow(d, (225, 410), (225, 620))
    save(img, "rys_4_1_erd.png")


def use_cases() -> None:
    img = Image.new("RGB", (1600, 1000), SAND)
    d = ImageDraw.Draw(img)
    d.text((70, 45), "Diagram przypadków użycia", font=FONT_TITLE, fill=GREEN)
    actors = [(90, 230, 330, 330, "Użytkownik\nniezalogowany"), (90, 470, 330, 570, "Użytkownik\nzalogowany"), (90, 710, 330, 810, "Administrator")]
    for x1, y1, x2, y2, title in actors:
        d.rounded_rectangle((x1, y1, x2, y2), radius=24, fill=GREEN, outline=GREEN2, width=3)
        text_center(d, (x1, y1, x2, y2), title, fill=WHITE, fnt=FONT_H)
    cases = [
        (520, 130, 860, 230, "Mapa i katalog miejsc"),
        (920, 130, 1260, 230, "Galeria zdjęć"),
        (520, 300, 860, 400, "W pobliżu i GPS"),
        (920, 300, 1260, 400, "Planer wycieczki"),
        (520, 500, 860, 600, "Ulubione i profil"),
        (920, 500, 1260, 600, "Historia wyszukiwań"),
        (520, 720, 860, 820, "Panel administratora"),
        (920, 720, 1260, 820, "Zarządzanie treścią"),
    ]
    for x1, y1, x2, y2, title in cases:
        d.rounded_rectangle((x1, y1, x2, y2), radius=50, fill=WHITE, outline=LINE, width=3)
        text_center(d, (x1, y1, x2, y2), title, fnt=FONT_H)
    for end in [(520, 180), (920, 180), (520, 350), (920, 350)]:
        arrow(d, (330, 280), end)
    for end in [(520, 550), (920, 550), (920, 350)]:
        arrow(d, (330, 520), end)
    for end in [(520, 770), (920, 770)]:
        arrow(d, (330, 760), end)
    save(img, "rys_3_3_przypadki_uzycia.png")


def login_flow() -> None:
    img = Image.new("RGB", (1700, 900), SAND)
    d = ImageDraw.Draw(img)
    d.text((70, 45), "Przepływ logowania administratora", font=FONT_TITLE, fill=GREEN)
    xs = [120, 460, 800, 1140, 1450]
    labels = ["Administrator", "Frontend", "Backend API", "SQLite", "Panel admina"]
    for x, label in zip(xs, labels):
        d.rounded_rectangle((x, 150, x + 220, 230), radius=22, fill=WHITE, outline=LINE, width=3)
        text_center(d, (x, 150, x + 220, 230), label, fnt=FONT_H)
        d.line((x + 110, 230, x + 110, 760), fill="#c7dccd", width=3)
    steps = [
        (230, 310, 460, "e-mail + hasło"),
        (570, 390, 800, "POST /auth/login"),
        (910, 470, 1140, "pobranie użytkownika"),
        (1250, 550, 800, "hash hasła"),
        (910, 630, 460, "token JWT"),
        (570, 710, 1450, "żądanie /api/admin z tokenem"),
    ]
    for sx, y, ex, label in steps:
        arrow(d, (sx, y), (ex, y))
        d.text((min(sx, ex) + 16, y - 30), label, font=FONT_SMALL, fill=INK)
    save(img, "rys_5_2_przeplyw_logowania.png")


def security_scope() -> None:
    img = Image.new("RGB", (1600, 900), SAND)
    d = ImageDraw.Draw(img)
    d.text((70, 45), "Zakres testów bezpieczeństwa", font=FONT_TITLE, fill=GREEN)
    center = (640, 360, 960, 520)
    rounded_box(d, center, "Testy bezpieczeństwa", "security-test.mjs", fill="#eef8ef")
    items = [
        ((80, 160, 430, 280), "Nagłówki HTTP"),
        ((80, 440, 430, 560), "Ochrona endpointów admina"),
        ((80, 650, 430, 770), "Błędne logowanie"),
        ((1170, 160, 1520, 280), "Słabe hasła"),
        ((1170, 440, 1520, 560), "SQL-like queries"),
        ((1170, 650, 1520, 770), "XSS-like queries"),
    ]
    for box, title in items:
        rounded_box(d, box, title, fill=WHITE)
        sx = center[0] if box[0] < center[0] else center[2]
        sy = (center[1] + center[3]) // 2
        ex = box[2] if box[0] < center[0] else box[0]
        ey = (box[1] + box[3]) // 2
        arrow(d, (sx, sy), (ex, ey), GOLD)
    save(img, "rys_8_2_zakres_testow_bezpieczenstwa.png")


def main() -> None:
    architecture()
    erd()
    use_cases()
    login_flow()
    security_scope()


if __name__ == "__main__":
    main()
