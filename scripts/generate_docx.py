from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "praca-dyplomowa.md"
OUTPUT = ROOT / "docs" / "word" / "praca-dyplomowa.docx"
SAFE_OUTPUT = ROOT / "docs" / "word" / "praca-dyplomowa-bezpieczna.docx"
LOGO = ROOT / "docs" / "assets" / "logo-akademia-tarnowska.png"

AUTHOR = "Robert Wilk"
ALBUM_NUMBER = "34780"
UNIVERSITY = "AKADEMIA TARNOWSKA"
FACULTY = "WYDZIAŁ NAUK TECHNICZNYCH"
FIELD = "INFORMATYKA"
STUDY_TYPE = "STUDIA STACJONARNE I STOPNIA"
WORK_TYPE = "/praca inżynierska/"
DEPARTMENT = "Katedrze Informatyki"
SUPERVISOR = "dr inż. Adam Pieprzycki"
CITY_YEAR = "Tarnów 2026"


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_border(cell, color: str = "B8D8C0") -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "8")
        element.set(qn("w:color"), color)


def add_hyperlink(paragraph, text: str, url: str) -> None:
    # Prosty zapis URL jako tekstu podkreślonego — wystarcza do dokumentacji roboczej.
    run = paragraph.add_run(text)
    run.font.color.rgb = RGBColor(27, 67, 50)
    run.font.underline = True


def configure_document(document: Document) -> None:
    section = document.sections[0]
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(3.5)
    section.right_margin = Cm(1.5)

    normal = document.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    normal.font.size = Pt(12)

    for style_name, size in [("Heading 1", 14), ("Heading 2", 12), ("Heading 3", 12)]:
        style = document.styles[style_name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor(27, 67, 50)

    section.different_first_page_header_footer = True
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer.add_run("Przewodnik w formie aplikacji mobilnej Ciężkowice — Robert Wilk")
    footer_run.font.size = Pt(9)
    footer_run.font.color.rgb = RGBColor(102, 117, 109)


def style_paragraph(paragraph, justify: bool = True) -> None:
    if justify:
        paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    paragraph.paragraph_format.line_spacing = 1.5
    paragraph.paragraph_format.space_after = Pt(6)


def add_text_paragraph(document: Document, text: str) -> None:
    paragraph = document.add_paragraph()
    style_paragraph(paragraph)
    # Minimalna obsługa linków w nawiasach/URL-ach — URL zostaje widoczny w tekście.
    paragraph.add_run(text)


def add_bullet(document: Document, text: str) -> None:
    paragraph = document.add_paragraph(style="List Bullet")
    style_paragraph(paragraph, justify=False)
    paragraph.add_run(text)


def add_code(document: Document, lines: list[str]) -> None:
    table = document.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_shading(cell, "F4F7F2")
    set_cell_border(cell)
    paragraph = cell.paragraphs[0]
    for i, line in enumerate(lines):
        if i:
            paragraph.add_run("\n")
        run = paragraph.add_run(line)
        run.font.name = "Consolas"
        run.font.size = Pt(9)


def add_markdown_table(document: Document, rows: list[list[str]]) -> None:
    if not rows:
        return
    table = document.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(rows):
        for c_idx, value in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            paragraph = cell.paragraphs[0]
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if r_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            run = paragraph.add_run(value)
            run.font.name = "Times New Roman"
            run.font.size = Pt(10)
            if r_idx == 0:
                run.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_shading(cell, "1B4332")
            else:
                set_cell_shading(cell, "F8FBF7" if r_idx % 2 == 0 else "FFFFFF")


def add_placeholder_or_image(document: Document, line: str) -> None:
    match = re.search(r"docs/assets/([^\s]+)", line)
    if not match:
        return
    image_path = ROOT / "docs" / "assets" / match.group(1)
    if image_path.exists():
        paragraph = document.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = paragraph.add_run()
        run.add_picture(str(image_path), width=Cm(15.5))
    else:
        table = document.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_shading(cell, "EEF6EF")
        set_cell_border(cell)
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = paragraph.add_run(f"Miejsce na zrzut ekranu: {image_path.name}")
        run.italic = True
        run.font.color.rgb = RGBColor(102, 117, 109)


def add_caption(document: Document, text: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(text)
    run.italic = True
    run.font.size = Pt(10)


def add_toc(document: Document, markdown_lines: list[str]) -> None:
    heading = document.add_paragraph("Spis treści", style="Heading 1")
    heading.paragraph_format.space_after = Pt(12)
    note = document.add_paragraph()
    note_run = note.add_run("Uwaga: po ostatecznym wstawieniu zrzutów ekranu można w Wordzie wstawić automatyczny spis treści: Odwołania → Spis treści.")
    note_run.italic = True
    note_run.font.size = Pt(10)

    for raw in markdown_lines:
        line = raw.strip()
        if line.startswith("## ") and not line.startswith("## Spis treści"):
            text = line[3:]
            p = document.add_paragraph()
            p.paragraph_format.left_indent = Cm(0)
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(text)
            run.bold = True
        elif line.startswith("### "):
            text = line[4:]
            p = document.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.7)
            p.paragraph_format.space_after = Pt(1)
            p.add_run(text)
    document.add_page_break()


def add_cover(document: Document, lines: list[str]) -> None:
    title = lines[0].replace("# ", "").strip()
    for _ in range(1):
        document.add_paragraph("")

    if LOGO.exists():
        logo_p = document.add_paragraph()
        logo_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        logo_p.add_run().add_picture(str(LOGO), width=Cm(5.2))

    document.add_paragraph("")
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(f"{UNIVERSITY}\n{FACULTY}")
    run.bold = True
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(0, 0, 0)

    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(f"KIERUNEK {FIELD}\n{STUDY_TYPE}")
    run.font.size = Pt(12)

    for _ in range(4):
        document.add_paragraph("")

    author_p = document.add_paragraph()
    author_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    author = author_p.add_run(f"Autor pracy\n{AUTHOR}\nNr albumu {ALBUM_NUMBER}")
    author.bold = True
    author.font.size = Pt(12)

    for _ in range(2):
        document.add_paragraph("")

    title_p = document.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run(f"Tytuł pracy\n{title}")
    title_run.bold = True
    title_run.font.size = Pt(14)

    work_p = document.add_paragraph()
    work_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    work_run = work_p.add_run(WORK_TYPE)
    work_run.font.size = Pt(12)

    for _ in range(3):
        document.add_paragraph("")

    dept_p = document.add_paragraph()
    dept_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    dept_run = dept_p.add_run(f"Praca wykonana w {DEPARTMENT}\npod kierunkiem {SUPERVISOR}\n\n/podpis promotora pracy/")
    dept_run.font.size = Pt(11)

    for _ in range(3):
        document.add_paragraph("")

    city_p = document.add_paragraph()
    city_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    city_run = city_p.add_run(CITY_YEAR)
    city_run.bold = True
    city_run.font.size = Pt(12)
    document.add_page_break()


def build_document(markdown: str) -> Document:
    document = Document()
    configure_document(document)

    lines = markdown.splitlines()
    # Okładka: wszystko do pierwszego ## Spis treści.
    try:
        toc_index = next(i for i, line in enumerate(lines) if line.startswith("## Spis treści"))
    except StopIteration:
        toc_index = 1
    add_cover(document, lines[:toc_index])

    in_code = False
    code_lines: list[str] = []
    table_rows: list[list[str]] = []

    def flush_table() -> None:
        nonlocal table_rows
        if table_rows:
            add_markdown_table(document, table_rows)
            table_rows = []

    skip_manual_toc = False
    for raw_line in lines[toc_index:]:
        line = raw_line.rstrip()

        if line.startswith("```"):
            if in_code:
                add_code(document, code_lines)
                code_lines = []
                in_code = False
            else:
                flush_table()
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        stripped = line.strip()
        if not stripped:
            flush_table()
            continue

        if stripped.startswith("## Spis treści"):
            add_toc(document, lines)
            skip_manual_toc = True
            continue

        if skip_manual_toc:
            if stripped.startswith("## Wstęp") or stripped.startswith("## Wykaz"):
                skip_manual_toc = False
            else:
                continue

        if stripped.startswith("|") and stripped.endswith("|"):
            if "---" not in stripped:
                table_rows.append([cell.strip() for cell in stripped.strip("|").split("|")])
            continue
        else:
            flush_table()

        if stripped.startswith("## "):
            text = stripped[3:]
            if text.startswith("Rozdział") or text in {"Wstęp", "Bibliografia"}:
                # Nowy rozdział od nowej strony, ale bez pustej strony tuż po okładce.
                if len(document.paragraphs) > 2 and text != "Spis treści":
                    document.add_section(WD_SECTION_START.NEW_PAGE)
            p = document.add_paragraph(text, style="Heading 1")
            p.paragraph_format.space_before = Pt(6)
        elif stripped.startswith("### "):
            p = document.add_paragraph(stripped[4:], style="Heading 2")
            p.paragraph_format.space_before = Pt(8)
        elif stripped.startswith("#### "):
            p = document.add_paragraph(stripped[5:], style="Heading 3")
            p.paragraph_format.space_before = Pt(6)
        elif stripped.startswith("- "):
            add_bullet(document, stripped[2:])
        elif stripped.startswith("MIEJSCE NA "):
            add_placeholder_or_image(document, stripped)
        elif stripped.startswith("Rys.") or stripped.startswith("Tabela "):
            add_caption(document, stripped)
        else:
            add_text_paragraph(document, stripped.replace("  ", " "))

    flush_table()
    return document


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    markdown = SOURCE.read_text(encoding="utf-8")
    document = build_document(markdown)
    document.save(OUTPUT)
    document.save(SAFE_OUTPUT)
    print(f"Wygenerowano: {OUTPUT}")
    print(f"Wygenerowano wersję bezpieczną: {SAFE_OUTPUT}")


if __name__ == "__main__":
    main()
