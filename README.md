# Trustpilot Review Extractor

En bookmarklet der udtrækker anmeldelser fra en Trustpilot-virksomhedsside, bladrer automatisk gennem paginering, viser en loader undervejs og downloader resultatet som CSV-fil (åbnes direkte i Excel).

## Installer bookmarkleten

GitHub sanitiserer `javascript:`-links i README, så drag-and-drop-knappen virker ikke direkte herfra. Du har to muligheder:

### Mulighed 1 — Drag-and-drop via GitHub Pages (anbefales)

Slå GitHub Pages til for dette repo (`Settings → Pages → Source: main / root`). Åbn derefter den publicerede side:

```
https://<dit-brugernavn>.github.io/<repo-navn>/
```

På den side kan du trække den grønne **⭐ Udtræk Trustpilot**-knap op i din bogmærkelinje.

### Mulighed 2 — Opret bogmærke manuelt

1. Højreklik på din bogmærkelinje → *Tilføj side* / *Nyt bogmærke*.
2. Navn: `Udtræk Trustpilot`.
3. URL: indsæt hele indholdet af [bookmarklet.txt](bookmarklet.txt) (starter med `javascript:`).
4. Gem.

## Sådan bruges den

1. Åbn en Trustpilot-virksomhedsside, fx `https://dk.trustpilot.com/review/eksempel.dk`.
2. Rul ned indtil overskriften **"Alle anmeldelser"** er synlig på siden.
3. Klik på bookmarkleten i din bogmærkelinje.
4. En **loader** vises midt på siden og opdaterer teksten per side mens scriptet bladrer gennem op til 10 sider.
5. Når udtrækningen er færdig, downloades en fil som `trustpilot-<domæne>-<tidsstempel>.csv` automatisk.
6. Forløbet kan også følges i browserens DevTools-konsol (F12).

### Om CSV-filen

CSV-filen bruger semikolon som separator og har en UTF-8 BOM, så dansk Excel åbner den direkte med korrekt Æ/Ø/Å og kolonner på plads. Kolonnerne er: `page`, `index`, `author`, `country`, `reviewCount`, `date`, `reviewDateTime`, `rating`, `verified`, `unsolicited`, `title`, `text`, `isAnswered`, `answerDateTime`, `answerTimeDays`.


## Indstillinger

Standardindstillinger ligger øverst i [trustpilot_exstractor.js](trustpilot_exstractor.js):

| Indstilling          | Default | Beskrivelse                                               |
|----------------------|---------|-----------------------------------------------------------|
| `maxPages`           | `10`    | Maksimalt antal sider der bladres igennem.                |
| `waitAfterClickMs`   | `2500`  | Pause efter klik på "Næste side" (ms).                    |
| `waitForChangeMs`    | `12000` | Maks. ventetid på at siden opdaterer sig (ms).            |

Hvis du ændrer noget, så kør bygget igen for at opdatere bookmarkletten:

```bash
node build-bookmarklet.js
```

Det genererer [bookmarklet.js](bookmarklet.js), [bookmarklet.txt](bookmarklet.txt) og opdaterer drag-knappen i [index.html](index.html).

## Filer

- [trustpilot_exstractor.js](trustpilot_exstractor.js) — kilde, læsbar version
- [build-bookmarklet.js](build-bookmarklet.js) — minificerer og pakker til bookmarklet
- [bookmarklet.js](bookmarklet.js) — minificeret version (uden `javascript:`-prefix)
- [bookmarklet.txt](bookmarklet.txt) — komplet `javascript:`-URL klar til indsætning
- [index.html](index.html) — GitHub Pages-side med drag-knap

## Begrænsninger og ansvar

- Scriptet er lavet til den danske Trustpilot-UI (`trustpilot.com` / `dk.trustpilot.com`) og forventer strenge som `"Alle anmeldelser"` og `"Næste side"`. Hvis Trustpilot ændrer markup eller tekster, kan scriptet knække.
- Kun til personligt brug. Respekter Trustpilots vilkår og eventuel lokal lovgivning om web scraping og persondata.
