// Bygger bookmarklet.js, bookmarklet.txt og opdaterer index.html ud fra trustpilot_exstractor.js.
// Kør: node build-bookmarklet.js

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "trustpilot_exstractor.js");
const OUT_JS = path.join(__dirname, "bookmarklet.js");
const OUT_TXT = path.join(__dirname, "bookmarklet.txt");
const INDEX = path.join(__dirname, "index.html");

function minify(code) {
  // Meget enkel minifier: fjerner kommentarer og overflødige whitespace.
  // Bevarer strenge og regexes ved at parse tegn for tegn.
  let out = "";
  let i = 0;
  const n = code.length;
  let inStr = null;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inRegex = false;
  let prevNonSpace = "";

  function canBeRegex(prev) {
    if (!prev) return true;
    return /[=(,?:;{}!&|+\-*/%<>^~\[]/.test(prev);
  }

  while (i < n) {
    const c = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && next === "/") { inBlockComment = false; i += 2; continue; }
      i++;
      continue;
    }
    if (inStr) {
      out += c;
      if (c === "\\" && next !== undefined) { out += next; i += 2; continue; }
      if (c === inStr) inStr = null;
      i++;
      continue;
    }
    if (inTemplate) {
      out += c;
      if (c === "\\" && next !== undefined) { out += next; i += 2; continue; }
      if (c === "`") inTemplate = false;
      i++;
      continue;
    }
    if (inRegex) {
      out += c;
      if (c === "\\" && next !== undefined) { out += next; i += 2; continue; }
      if (c === "[") {
        // character class
        while (i + 1 < n) {
          i++;
          const cc = code[i];
          out += cc;
          if (cc === "\\" && code[i + 1] !== undefined) { out += code[++i]; continue; }
          if (cc === "]") break;
        }
      } else if (c === "/") {
        inRegex = false;
        // consume flags
        while (i + 1 < n && /[a-z]/i.test(code[i + 1])) { i++; out += code[i]; }
      }
      i++;
      continue;
    }

    if (c === "/" && next === "/") { inLineComment = true; i += 2; continue; }
    if (c === "/" && next === "*") { inBlockComment = true; i += 2; continue; }
    if (c === '"' || c === "'") { inStr = c; out += c; prevNonSpace = c; i++; continue; }
    if (c === "`") { inTemplate = true; out += c; prevNonSpace = c; i++; continue; }
    if (c === "/" && canBeRegex(prevNonSpace)) { inRegex = true; out += c; prevNonSpace = c; i++; continue; }

    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      // kollaps whitespace, men bevar hvor nødvendigt mellem identifiers
      let j = i;
      while (j < n && /[ \t\n\r]/.test(code[j])) j++;
      const nc = code[j];
      const needed = prevNonSpace && nc && /[A-Za-z0-9_$]/.test(prevNonSpace) && /[A-Za-z0-9_$]/.test(nc);
      if (needed) out += " ";
      i = j;
      continue;
    }

    out += c;
    prevNonSpace = c;
    i++;
  }

  return out;
}

const src = fs.readFileSync(SRC, "utf8");
const minified = minify(src);

const bookmarklet = "javascript:" + encodeURIComponent(minified);

fs.writeFileSync(OUT_JS, minified, "utf8");
fs.writeFileSync(OUT_TXT, bookmarklet, "utf8");

console.log(`Skrev ${path.basename(OUT_JS)} (${minified.length} tegn)`);
console.log(`Skrev ${path.basename(OUT_TXT)} (${bookmarklet.length} tegn)`);

// Opdater index.html hvis den findes: erstat indholdet af <a id="bm" href="...">
if (fs.existsSync(INDEX)) {
  let html = fs.readFileSync(INDEX, "utf8");
  const escaped = bookmarklet.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  html = html.replace(/(<a[^>]*id="bm"[^>]*href=")[^"]*(")/, `$1${escaped}$2`);
  fs.writeFileSync(INDEX, html, "utf8");
  console.log("Opdaterede index.html med ny bookmarklet.");
}
