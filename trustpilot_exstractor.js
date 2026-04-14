(async () => {
  const SETTINGS = {
    maxPages: 10,          // sæt højere hvis du vil hente flere sider
    waitAfterClickMs: 2500,
    waitForChangeMs: 12000
  };

  function cleanText(str) {
    return (str || "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getText(el) {
    return cleanText(el?.innerText || el?.textContent || "");
  }

  function getLines(el) {
    return (el?.innerText || el?.textContent || "")
      .split("\n")
      .map(cleanText)
      .filter(Boolean);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getRating(card) {
    const img = card.querySelector('img[alt*="Bedømt til"]');
    if (!img) return null;
    const alt = img.getAttribute("alt") || "";
    const m = alt.match(/Bedømt til\s+(\d+)\s+ud af 5/i);
    return m ? Number(m[1]) : null;
  }

  function isAfter(a, b) {
    return !!(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  function findHeading() {
    return [...document.querySelectorAll("h1,h2,h3,h4,div,span,p")]
      .find(el => getText(el) === "Alle anmeldelser");
  }

  function looksLikeRelativeTime(str) {
    return /^(Lige nu|For \d+ .+ siden|Opdateret for \d+ .+ siden)$/i.test(str);
  }

  function looksLikeDate(str) {
    return /^\d{1,2}\.\s+[a-zæøå]+\s+\d{4}$/i.test(str);
  }

  function looksLikeCountry(str) {
    return /^[A-Z]{2}$/i.test(str);
  }

  function looksLikeReviewCount(str) {
    return /^\d+\s+anmeldelser?$/i.test(str);
  }

  function isAvatarInitials(str) {
    return /^[A-ZÆØÅ]{1,3}$/i.test(str);
  }

  function diffDays(fromDate, toDate) {
    if (!fromDate || !toDate) return null;
    return Math.round(((toDate.getTime() - fromDate.getTime()) / 86400000) * 100) / 100;
  }

  function parseAuthorBlock(lines) {
    for (let i = 0; i < lines.length - 4; i++) {
      if (
        isAvatarInitials(lines[i]) &&
        !looksLikeRelativeTime(lines[i + 1]) &&
        !looksLikeDate(lines[i + 1]) &&
        !looksLikeCountry(lines[i + 1]) &&
        looksLikeCountry(lines[i + 2]) &&
        lines[i + 3] === "•" &&
        looksLikeReviewCount(lines[i + 4])
      ) {
        return {
          author: lines[i + 1],
          authorLine: `${lines[i + 2]} • ${lines[i + 4]}`,
          country: lines[i + 2],
          reviewCount: Number((lines[i + 4].match(/\d+/) || [])[0] || null),
          usedIndexes: [i, i + 1, i + 2, i + 3, i + 4]
        };
      }
    }

    for (let i = 0; i < lines.length - 3; i++) {
      if (
        !isAvatarInitials(lines[i]) &&
        !looksLikeRelativeTime(lines[i]) &&
        !looksLikeDate(lines[i]) &&
        !looksLikeCountry(lines[i]) &&
        looksLikeCountry(lines[i + 1]) &&
        lines[i + 2] === "•" &&
        looksLikeReviewCount(lines[i + 3])
      ) {
        return {
          author: lines[i],
          authorLine: `${lines[i + 1]} • ${lines[i + 3]}`,
          country: lines[i + 1],
          reviewCount: Number((lines[i + 3].match(/\d+/) || [])[0] || null),
          usedIndexes: [i, i + 1, i + 2, i + 3]
        };
      }
    }

    return {
      author: null,
      authorLine: null,
      country: null,
      reviewCount: null,
      usedIndexes: []
    };
  }

  function findReviewCards(heading) {
    const reviewLinks = [...document.querySelectorAll('a[href*="/reviews/"]')]
      .filter(a => isAfter(a, heading));

    const cards = [];

    for (const link of reviewLinks) {
      let el = link;
      while (el && el !== document.body) {
        const txt = getText(el);
        const hasRating = !!el.querySelector('img[alt*="Bedømt til"]');
        const hasReviewLink = !!el.querySelector('a[href*="/reviews/"]');
        const hasRelativeTime = /For \d+ .+ siden|Lige nu|Opdateret for \d+ .+ siden/i.test(txt);
        const hasDate = /\d{1,2}\.\s+[a-zæøå]+\s+\d{4}/i.test(txt);

        if (hasRating && hasReviewLink && hasRelativeTime && hasDate && txt.length < 5000) {
          cards.push(el);
          break;
        }

        el = el.parentElement;
      }
    }

    const unique = [];
    const seen = new Set();

    for (const card of cards) {
      if (!card || seen.has(card)) continue;
      seen.add(card);
      unique.push(card);
    }

    return unique.filter(card => !unique.some(other => other !== card && card.contains(other)));
  }

  function getTimeElements(card) {
    return [...card.querySelectorAll("time[datetime]")].map(t => ({
      el: t,
      datetime: t.getAttribute("datetime"),
      text: cleanText(t.textContent),
      title: cleanText(t.getAttribute("title") || ""),
      replyMarker: t.hasAttribute("data-service-review-business-reply-date-time-ago")
    }));
  }

  function extractPreciseTimes(card) {
    const timeEls = getTimeElements(card);

    let reviewDateTime = null;
    let answerDateTime = null;

    for (const t of timeEls) {
      if (t.replyMarker) {
        answerDateTime = t.datetime;
      } else if (!reviewDateTime) {
        reviewDateTime = t.datetime;
      }
    }

    return { reviewDateTime, answerDateTime };
  }

  function extractAnswerInfo(card) {
    const lines = getLines(card);
    const isAnswered = lines.some(line => /^Besvarelse fra /i.test(line));
    const times = extractPreciseTimes(card);

    let answerTimeDays = null;
    if (isAnswered && times.reviewDateTime && times.answerDateTime) {
      answerTimeDays = diffDays(new Date(times.reviewDateTime), new Date(times.answerDateTime));
    }

    return {
      isAnswered,
      reviewDateTime: times.reviewDateTime,
      answerDateTime: times.answerDateTime,
      answerTimeDays
    };
  }

  function extractReview(card, index, pageNumber) {
    const lines = getLines(card);
    const meta = parseAuthorBlock(lines);

    let relativeTime = null;
    let date = null;
    let verified = false;
    let unsolicited = false;

    for (const line of lines) {
      if (!relativeTime && looksLikeRelativeTime(line)) relativeTime = line;
      else if (!date && looksLikeDate(line)) date = line;
      else if (/^Verificeret$/i.test(line)) verified = true;
      else if (/^Uopfordret anmeldelse$/i.test(line)) unsolicited = true;
    }

    const answerInfo = extractAnswerInfo(card);

    const contentLines = lines.filter((line, idx) => {
      if (meta.usedIndexes.includes(idx)) return false;
      if (looksLikeRelativeTime(line)) return false;
      if (looksLikeDate(line)) return false;
      if (/^Verificeret$/i.test(line)) return false;
      if (/^Uopfordret anmeldelse$/i.test(line)) return false;
      if (/^Bedømt til \d+ ud af 5 stjerner$/i.test(line)) return false;
      if (/^(Nyttig|Del)$/i.test(line)) return false;
      if (/^Se \d+ anmeldelse(r)? mere skrevet af/i.test(line)) return false;
      if (/^Besvarelse fra /i.test(line)) return false;
      if (line === "•") return false;
      if (isAvatarInitials(line) && idx === 0) return false;
      return true;
    });

    const answerStartIndex = contentLines.findIndex(line => /^Hej\b/i.test(line));
    const reviewContentLines = answerStartIndex > -1
      ? contentLines.slice(0, answerStartIndex)
      : contentLines;

    const title = reviewContentLines[0] || null;
    const text = reviewContentLines.length > 1
      ? reviewContentLines.slice(1).join(" ")
      : "";

    return {
      page: pageNumber,
      index: index + 1,
      author: meta.author,
      authorLine: meta.authorLine,
      country: meta.country,
      reviewCount: meta.reviewCount,
      relativeTime,
      date,
      reviewDateTime: answerInfo.reviewDateTime,
      rating: getRating(card),
      verified,
      unsolicited,
      title,
      text,
      isAnswered: answerInfo.isAnswered,
      answerDateTime: answerInfo.answerDateTime,
      answerTimeDays: answerInfo.answerTimeDays
    };
  }

  function getCurrentPageMarker() {
    const heading = findHeading();
    const cards = heading ? findReviewCards(heading) : [];
    const firstCardText = cards[0] ? getText(cards[0]).slice(0, 200) : "";
    return `${location.href}||${firstCardText}`;
  }

  function findNextPageButton() {
    const candidates = [
      ...document.querySelectorAll('a, button, [role="button"]')
    ];

    return candidates.find(el => {
      const txt = getText(el);
      if (!/^Næste side$/i.test(txt)) return false;

      const ariaDisabled = el.getAttribute("aria-disabled");
      const disabled = el.disabled === true;
      const href = el.getAttribute("href");

      if (ariaDisabled === "true" || disabled) return false;
      if (el.tagName.toLowerCase() === "a" && href === "#") return true;
      return true;
    }) || null;
  }

  async function waitForPageChange(previousMarker) {
    const start = Date.now();

    while (Date.now() - start < SETTINGS.waitForChangeMs) {
      await sleep(400);

      const marker = getCurrentPageMarker();
      if (marker && marker !== previousMarker) {
        await sleep(1200);
        return true;
      }
    }

    return false;
  }

  function dedupeReviews(reviews) {
    const seen = new Set();

    return reviews.filter(r => {
      const key = JSON.stringify([
        r.author,
        r.authorLine,
        r.reviewDateTime,
        r.date,
        r.title,
        r.text,
        r.rating
      ]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function scrapeCurrentPage(pageNumber) {
    const heading = findHeading();
    if (!heading) {
      throw new Error('Kunne ikke finde "Alle anmeldelser"');
    }

    const cards = findReviewCards(heading);
    const reviews = cards.map((card, i) => extractReview(card, i, pageNumber));

    return {
      cardsCount: cards.length,
      reviews
    };
  }

  async function goToNextPage() {
    const previousMarker = getCurrentPageMarker();
    const nextBtn = findNextPageButton();

    if (!nextBtn) return false;

    nextBtn.click();
    await sleep(SETTINGS.waitAfterClickMs);

    const changed = await waitForPageChange(previousMarker);
    return changed;
  }

  const all = [];
  let pageNumber = 1;

  for (; pageNumber <= SETTINGS.maxPages; pageNumber++) {
    const { cardsCount, reviews } = await scrapeCurrentPage(pageNumber);

    console.log(`Side ${pageNumber}: fandt ${cardsCount} review-kort / ${reviews.length} reviews`);
    all.push(...reviews);

    const moved = await goToNextPage();
    if (!moved) {
      console.log("Ingen næste side fundet, eller siden ændrede sig ikke mere.");
      break;
    }
  }

  const deduped = dedupeReviews(all);

  window.trustpilotAllReviews = deduped;

  console.log(`Samlet antal reviews: ${deduped.length}`);
  console.log(JSON.stringify(deduped, null, 2));

  function slugifyHost() {
    try {
      return location.hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-") || "trustpilot";
    } catch (_) {
      return "trustpilot";
    }
  }

  function downloadJson(data) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `trustpilot-${slugifyHost()}-${ts}.json`;
    const payload = {
      source: location.href,
      extractedAt: new Date().toISOString(),
      count: data.length,
      reviews: data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    console.log(`Downloadet ${filename}`);
  }

  downloadJson(deduped);
})();