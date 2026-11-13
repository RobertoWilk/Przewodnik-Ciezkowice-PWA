from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt


ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "docs" / "forms" / "Zgloszenie2026.docx"
BACKUP = ROOT / "docs" / "forms" / "Zgloszenie2026_przyklad_backup.docx"


def set_paragraph(paragraph, text: str, *, bold: bool = False, align=None, size: int | None = None) -> None:
    paragraph.text = ""
    run = paragraph.add_run(text)
    run.bold = bold
    if size:
        run.font.size = Pt(size)
    if align is not None:
        paragraph.alignment = align


def clear_cell(cell) -> None:
    cell.text = ""
    for paragraph in cell.paragraphs:
        paragraph.text = ""


def add_cell_paragraph(cell, text: str = "", *, bold: bool = False, size: int | None = None) -> None:
    if len(cell.paragraphs) == 1 and not cell.paragraphs[0].text:
        paragraph = cell.paragraphs[0]
    else:
        paragraph = cell.add_paragraph()
    run = paragraph.add_run(text)
    run.bold = bold
    if size:
        run.font.size = Pt(size)


def main() -> None:
    if not DOCX.exists():
        raise FileNotFoundError(DOCX)

    if not BACKUP.exists():
        BACKUP.write_bytes(DOCX.read_bytes())

    document = Document(DOCX)

    # Nagłówek dokumentu.
    set_paragraph(document.paragraphs[0], "Załącznik 1 Wzór formularza zgłoszenia tematu pracy dyplomowej")
    set_paragraph(document.paragraphs[1], "Tarnów, dnia 26 kwietnia 2026")
    set_paragraph(document.paragraphs[4], "FORMULARZ ZGŁOSZENIA", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=14)
    set_paragraph(document.paragraphs[5], "TEMATU PRACY DYPLOMOWEJ", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=14)
    set_paragraph(document.paragraphs[6], "NA ROK AKADEMICKI 2025/2026", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=14)
    if len(document.paragraphs) > 7:
        set_paragraph(document.paragraphs[7], "")

    table = document.tables[0]

    # Dane zgłaszającego.
    cell = table.rows[0].cells[0]
    clear_cell(cell)
    add_cell_paragraph(cell, "Zgłaszający: dr inż. Adam Pieprzycki", bold=True)
    add_cell_paragraph(cell, "Tytuł/stopień, Imię i Nazwisko")
    add_cell_paragraph(cell, "")
    add_cell_paragraph(cell, "Katedra: Informatyki", bold=True)

    # Temat i opis pracy.
    cell = table.rows[1].cells[0]
    clear_cell(cell)
    add_cell_paragraph(cell, "1. Temat: Przewodnik w formie aplikacji mobilnej Ciężkowice.", bold=True)
    add_cell_paragraph(cell, "2. Opis tematu (zakres pracy):", bold=True)
    add_cell_paragraph(
        cell,
        "Celem pracy jest zaprojektowanie oraz implementacja responsywnej aplikacji internetowej typu PWA, "
        "pełniącej funkcję przewodnika turystycznego po Ciężkowicach. System będzie dostępny na telefonie, "
        "tablecie oraz komputerze i umożliwi użytkownikowi poznanie najważniejszych atrakcji turystycznych, "
        "zabytków, szlaków, historii miejscowości, ciekawostek, zdjęć, restauracji, możliwych noclegów oraz "
        "propozycji wycieczki 1-dniowej i 2-dniowej.",
    )
    add_cell_paragraph(cell, "")
    add_cell_paragraph(cell, "Zakres pracy obejmuje:", bold=True)
    scope = [
        "Analizę materiałów źródłowych dotyczących Ciężkowic i okolic oraz przygotowanie danych startowych wraz z oznaczeniem źródeł.",
        "Zaprojektowanie modelu danych przechowującego miejsca, zdjęcia, trasy, plany wycieczek, użytkowników, ulubione miejsca, historię wyszukiwań oraz ustawienia aplikacji.",
        "Implementację backendu w technologii Node.js i Express, udostępniającego dane przez REST API oraz obsługującego logowanie i panel administracyjny.",
        "Implementację frontendu w technologii React i TypeScript, działającego jako aplikacja PWA.",
        "Wykonanie interaktywnej mapy z wykorzystaniem biblioteki Leaflet i OpenStreetMap, z markerami miejsc, trasami oraz lokalizacją użytkownika.",
        "Przygotowanie modułu „W pobliżu”, który wykorzystuje geolokalizację telefonu, sortuje miejsca według odległości i pozwala oznaczać obiekty jako odwiedzone.",
        "Przygotowanie katalogu miejsc, widoku szczegółowego miejsca, galerii zdjęć oraz przycisku prowadzącego do zewnętrznej nawigacji mapowej.",
        "Przygotowanie gotowych planów wycieczki 1-dniowej i 2-dniowej oraz planera własnej wycieczki zapisywanego lokalnie w przeglądarce.",
        "Wdrożenie kont użytkowników, ulubionych miejsc, historii wyszukiwań, profilu użytkownika oraz ustawień motywu jasnego i ciemnego.",
        "Implementację panelu administratora umożliwiającego zarządzanie miejscami, zdjęciami, trasami, planami wycieczek i ustawieniami aplikacji.",
        "Przeprowadzenie podstawowych testów działania aplikacji oraz przygotowanie dokumentacji technicznej i użytkowej.",
    ]
    for item in scope:
        add_cell_paragraph(cell, f"• {item}")

    add_cell_paragraph(cell, "")
    add_cell_paragraph(cell, "Informacje dodatkowe (np. literatura, narzędzia, wymagania itp.):", bold=True)
    add_cell_paragraph(
        cell,
        "Literatura: dokumentacja technologii React, TypeScript, Vite, Node.js, Express, Leaflet, SQLite i PWA; "
        "materiały źródłowe dotyczące Ciężkowic, w tym oficjalny portal Gminy Ciężkowice, strona Muzeum Przyrodniczego "
        "w Ciężkowicach, strona Centrum Paderewskiego w Kąśnej Dolnej oraz publiczne hasła encyklopedyczne.",
    )
    add_cell_paragraph(cell, "Narzędzia:", bold=True)
    add_cell_paragraph(cell, "• Frontend: React, TypeScript, Vite, HTML5, CSS3, Leaflet, OpenStreetMap.")
    add_cell_paragraph(cell, "• Backend: Node.js, Express, JWT, bcryptjs.")
    add_cell_paragraph(cell, "• Baza danych: SQLite.")
    add_cell_paragraph(cell, "• Inne: npm, Git, Visual Studio Code, przeglądarka internetowa, narzędzia deweloperskie przeglądarki.")
    add_cell_paragraph(
        cell,
        "Wymagania: dyplomant powinien posiadać znajomość podstaw tworzenia aplikacji internetowych, języka JavaScript/TypeScript, "
        "projektowania REST API, podstaw baz danych oraz zasad tworzenia responsywnych interfejsów użytkownika.",
    )

    # Kierunek i koszty.
    cell = table.rows[2].cells[0]
    clear_cell(cell)
    add_cell_paragraph(cell, "3. Proponowany temat dedykowany jest dla", bold=True)
    add_cell_paragraph(cell, "kierunku Informatyka")
    add_cell_paragraph(cell, "")
    add_cell_paragraph(cell, "4. Przewidywane koszty: nie przewiduje się dodatkowych kosztów realizacji pracy.", bold=True)
    add_cell_paragraph(cell, "Projekt wykorzystuje darmowe narzędzia oraz technologie open-source. Ewentualne koszty hostingu mogą pojawić się dopiero przy przyszłym publicznym wdrożeniu aplikacji.")
    add_cell_paragraph(cell, "(Szczegółowe informacje w załączniku)")

    # Podpisy.
    set_paragraph(document.paragraphs[14], "      podpis zgłaszającego                                      podpis Kierownika Katedry")

    document.save(DOCX)
    print(f"Wypełniono formularz: {DOCX}")
    print(f"Kopia przykładowego pliku: {BACKUP}")


if __name__ == "__main__":
    main()
