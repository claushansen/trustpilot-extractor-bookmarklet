# Trustpilot Review Extractor

En bookmarklet der udtrækker anmeldelser fra en Trustpilot-virksomhedsside, bladrer automatisk gennem paginering, viser en loader undervejs og lader dig vælge mellem **Excel (CSV)** og **JSON** når den er færdig.

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
5. Når udtrækningen er færdig, åbner en **modal** hvor du vælger format: **Excel (CSV)** eller **JSON**.
6. Filen downloades som `trustpilot-<domæne>-<tidsstempel>.csv` eller `.json`.
7. Forløbet kan også følges i browserens DevTools-konsol (F12).

### Om Excel-filen

CSV-filen bruger semikolon som separator og har en UTF-8 BOM, så dansk Excel åbner den direkte med korrekt Æ/Ø/Å og kolonner på plads. Kolonnerne er: `page`, `index`, `author`, `country`, `reviewCount`, `date`, `reviewDateTime`, `rating`, `verified`, `unsolicited`, `title`, `text`, `isAnswered`, `answerDateTime`, `answerTimeDays`.

## JSON-formatet

```json
{
  "source": "https://dk.trustpilot.com/review/eksempel.dk",
  "extractedAt": "2026-04-14T10:22:31.002Z",
  "count": 42,
  "reviews": [
    {
      "page": 1,
      "index": 1,
      "author": "Jens Jensen",
      "authorLine": "DK • 3 anmeldelser",
      "country": "DK",
      "reviewCount": 3,
      "relativeTime": "For 2 dage siden",
      "date": "12. april 2026",
      "reviewDateTime": "2026-04-12T09:14:00.000Z",
      "rating": 5,
      "verified": true,
      "unsolicited": false,
      "title": "Fantastisk service",
      "text": "Hurtig levering og god kommunikation ...",
      "isAnswered": true,
      "answerDateTime": "2026-04-13T07:02:00.000Z",
      "answerTimeDays": 0.91
    }
  ]
}
```

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
