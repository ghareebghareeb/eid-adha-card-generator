/* ==========================================================================
   Eid Adha Card Generator — App Logic
   ========================================================================== */

(function () {
  "use strict";

  // --------------------------- State ---------------------------
  const state = {
    name: "فلان الفلاني",
    message: "تقبّل الله منا ومنكم صالح الأعمال",
    image: null,
    template: "1",
  };

  // --------------------------- DOM Refs ---------------------------
  const $name = document.getElementById("nameInput");
  const $message = document.getElementById("messageInput");
  const $image = document.getElementById("imageInput");
  const $fileDrop = document.getElementById("fileDrop");
  const $filePreview = document.getElementById("filePreview");
  const $filePreviewImg = document.getElementById("filePreviewImg");
  const $templateGrid = document.getElementById("templateGrid");
  const $card = document.getElementById("cardPreview");
  const $downloadBtn = document.getElementById("downloadBtn");

  // --------------------------- Template Themes ---------------------------
  // Each theme drives the mosaic frame palette and the sheep colors.
  const THEMES = {
    "1": { // Gold Classic
      frame: {
        base: "#f0d97c",
        dark: "#7a4a13",
        accent: "#b8860b",
        light: "#fff3cf",
        contrast: "#8b3a3a",
      },
      sheep: { wool: "#fff8e7", face: "#3a2a08", hoof: "#3a2a08", accent: "#b8860b" },
    },
    "2": { // Emerald
      frame: {
        base: "#0e6b54",
        dark: "#063427",
        accent: "#d4af37",
        light: "#d8f0e3",
        contrast: "#a83232",
      },
      sheep: { wool: "#fff8e7", face: "#063427", hoof: "#063427", accent: "#d4af37" },
    },
    "3": { // Royal Purple
      frame: {
        base: "#2c1a4f",
        dark: "#14092a",
        accent: "#d4af37",
        light: "#e8dffb",
        contrast: "#b3326d",
      },
      sheep: { wool: "#fff8e7", face: "#14092a", hoof: "#14092a", accent: "#d4af37" },
    },
    "4": { // Light Mosaic (closest to the reference image)
      frame: {
        base: "#cfe2ee",
        dark: "#2c4a64",
        accent: "#e3a35a",
        light: "#ffffff",
        contrast: "#1c5fa0",
      },
      sheep: { wool: "#ffffff", face: "#2c4a64", hoof: "#2c4a64", accent: "#e3a35a" },
    },
  };

  // --------------------------- Building Blocks ---------------------------

  /**
   * A single zellige-style mosaic tile (used to tile the frame border).
   * 8-pointed star at center + corner accents — classic Islamic geometric motif.
   */
  function mosaicTileSVG(size, t) {
    const cx = size / 2;
    const half = size * 0.46; // 8-point star outer radius
    const inner = size * 0.28; // inner square
    const dotR = size * 0.08;

    // Two squares rotated 0 and 45 deg overlap = 8-point star
    return `
      <g>
        <rect width="${size}" height="${size}" fill="${t.base}"/>
        <!-- corner diamonds (4 small) -->
        <g fill="${t.contrast}">
          <polygon points="0,0 ${size*0.18},${size*0.18} 0,${size*0.36} -${size*0.18},${size*0.18}" transform="translate(0,0)"/>
          <polygon points="0,0 ${size*0.18},${size*0.18} 0,${size*0.36} -${size*0.18},${size*0.18}" transform="translate(${size},0)"/>
          <polygon points="0,0 ${size*0.18},${size*0.18} 0,${size*0.36} -${size*0.18},${size*0.18}" transform="translate(0,${size})"/>
          <polygon points="0,0 ${size*0.18},${size*0.18} 0,${size*0.36} -${size*0.18},${size*0.18}" transform="translate(${size},${size})"/>
        </g>
        <!-- 8-point star outer -->
        <g transform="translate(${cx},${cx})" fill="${t.dark}">
          <rect x="-${half}" y="-${half}" width="${half*2}" height="${half*2}" transform="rotate(0)"/>
          <rect x="-${half}" y="-${half}" width="${half*2}" height="${half*2}" transform="rotate(45)"/>
        </g>
        <!-- 8-point star middle -->
        <g transform="translate(${cx},${cx})" fill="${t.accent}">
          <rect x="-${half*0.72}" y="-${half*0.72}" width="${half*1.44}" height="${half*1.44}" transform="rotate(0)"/>
          <rect x="-${half*0.72}" y="-${half*0.72}" width="${half*1.44}" height="${half*1.44}" transform="rotate(45)"/>
        </g>
        <!-- inner square -->
        <g transform="translate(${cx},${cx})" fill="${t.light}">
          <rect x="-${inner}" y="-${inner}" width="${inner*2}" height="${inner*2}" transform="rotate(45)"/>
        </g>
        <!-- center dot -->
        <circle cx="${cx}" cy="${cx}" r="${dotR}" fill="${t.dark}"/>
      </g>
    `;
  }

  /**
   * Inner thin braid line that runs along the inside edge of the frame.
   */
  function braidPathSVG(W, H, T, t) {
    const inset = T - 4;
    return `
      <rect x="${inset}" y="${inset}"
            width="${W - inset * 2}" height="${H - inset * 2}"
            fill="none" stroke="${t.dark}" stroke-width="2" />
      <rect x="${inset + 4}" y="${inset + 4}"
            width="${W - (inset + 4) * 2}" height="${H - (inset + 4) * 2}"
            fill="none" stroke="${t.accent}" stroke-width="1" stroke-dasharray="3 3"/>
    `;
  }

  /**
   * Build the full mosaic frame as an SVG, tiling the 4 edges with the mosaic tile.
   * Output is wrapped as a data URI so it renders reliably (incl. with html-to-image).
   */
  function buildFrameSVG(theme) {
    const W = 600;
    const H = 600;
    const TILE = 60;
    const T = TILE; // single-row mosaic frame

    const tiles = [];
    // Top + bottom (full width)
    for (let x = 0; x < W; x += TILE) {
      tiles.push(`<g transform="translate(${x},0)">${mosaicTileSVG(TILE, theme.frame)}</g>`);
      tiles.push(`<g transform="translate(${x},${H - TILE})">${mosaicTileSVG(TILE, theme.frame)}</g>`);
    }
    // Left + right (excluding corners already covered by top/bottom)
    for (let y = T; y < H - T; y += TILE) {
      tiles.push(`<g transform="translate(0,${y})">${mosaicTileSVG(TILE, theme.frame)}</g>`);
      tiles.push(`<g transform="translate(${W - TILE},${y})">${mosaicTileSVG(TILE, theme.frame)}</g>`);
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        ${tiles.join("")}
        ${braidPathSVG(W, H, T, theme.frame)}
      </svg>
    `;

    return svg;
  }

  /**
   * Sheep illustration tinted to the active theme.
   */
  function sheepSVG({ wool, face, hoof, accent } = {}) {
    return `
      <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-label="خروف">
        <ellipse cx="32" cy="38" rx="9" ry="6" fill="${face}" opacity="0.85"/>
        <g fill="${wool}">
          <circle cx="40" cy="60" r="18"/>
          <circle cx="60" cy="52" r="20"/>
          <circle cx="80" cy="58" r="18"/>
          <circle cx="50" cy="72" r="16"/>
          <circle cx="72" cy="74" r="16"/>
          <circle cx="92" cy="68" r="14"/>
          <circle cx="32" cy="68" r="14"/>
        </g>
        <ellipse cx="42" cy="50" rx="14" ry="13" fill="${face}"/>
        <ellipse cx="32" cy="40" rx="6" ry="4" fill="${face}" transform="rotate(-25 32 40)"/>
        <ellipse cx="54" cy="40" rx="6" ry="4" fill="${face}" transform="rotate(25 54 40)"/>
        <ellipse cx="32" cy="40" rx="2.5" ry="1.6" fill="${accent}" transform="rotate(-25 32 40)"/>
        <ellipse cx="54" cy="40" rx="2.5" ry="1.6" fill="${accent}" transform="rotate(25 54 40)"/>
        <circle cx="38" cy="50" r="1.8" fill="${wool}"/>
        <circle cx="48" cy="50" r="1.8" fill="${wool}"/>
        <ellipse cx="43" cy="56" rx="3" ry="2" fill="${wool}" opacity="0.9"/>
        <rect x="40" y="80" width="5" height="12" rx="1.5" fill="${hoof}"/>
        <rect x="55" y="82" width="5" height="12" rx="1.5" fill="${hoof}"/>
        <rect x="72" y="82" width="5" height="12" rx="1.5" fill="${hoof}"/>
        <rect x="86" y="80" width="5" height="12" rx="1.5" fill="${hoof}"/>
        <path d="M36 38 q-4 -3 -2 -8" stroke="${accent}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </svg>
    `;
  }

  /**
   * Crescent moon placeholder for when no image is uploaded.
   */
  function crescentPlaceholderSVG(color) {
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="60" height="60" aria-hidden="true">
        <g fill="${color}">
          <path d="M50 18 a18 18 0 1 0 0 44 a14 14 0 1 1 0 -44z"/>
          <path d="M22 30 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1z"/>
        </g>
      </svg>
    `;
  }

  // --------------------------- Render ---------------------------

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Keep the user's name on a single line by shrinking font-size to fit
   * the available width inside the card. Falls back to a tiny minimum
   * size so very long names don't disappear.
   */
  function autoFitName() {
    const nameEl = $card.querySelector(".name-text");
    const fromBlock = $card.querySelector(".from-block");
    const labelEl = $card.querySelector(".from-label");
    const cardInner = $card.querySelector(".card-inner");
    if (!nameEl || !fromBlock || !cardInner) return;

    const MAX = 32;
    const MIN = 14;

    nameEl.style.fontSize = MAX + "px";
    if (labelEl) labelEl.style.fontSize = "";

    const cardInnerWidth = cardInner.clientWidth || $card.clientWidth * 0.76;
    const maxRowWidth = cardInnerWidth * 0.96;

    let size = MAX;
    // Loop until from-block fits, OR we hit the minimum size.
    while (size > MIN && fromBlock.scrollWidth > maxRowWidth) {
      size -= 1;
      nameEl.style.fontSize = size + "px";
      // Shrink the label proportionally a bit too so the layout stays balanced.
      if (labelEl) labelEl.style.fontSize = Math.max(13, 18 - (MAX - size) * 0.3) + "px";
    }
  }

  function renderCard() {
    const theme = THEMES[state.template] || THEMES["1"];
    const frameSVG = buildFrameSVG(theme);

    const name = escapeHTML(state.name || "");
    const message = escapeHTML(state.message || "");

    const imageBlock = state.image
      ? `<div class="user-image-wrap"><img src="${state.image}" alt="" crossorigin="anonymous" /></div>`
      : `<div class="user-image-wrap is-empty"><span class="placeholder-text">صورتك هنا</span></div>`;

    $card.setAttribute("data-template", state.template);

    $card.innerHTML = `
      <div class="card-bg"></div>
      <div class="frame-layer">${frameSVG}</div>
      <div class="card-inner">
        ${imageBlock}

        <div class="from-block">
          <span class="from-label">يهنّئكم</span>
          <h3 class="name-text">${name || "—"}</h3>
        </div>

        <div class="ornament-line"></div>

        <h2 class="eid-greeting">عيد أضحى مبارك</h2>
        <p class="eid-subtitle">${message || "تقبّل الله منا ومنكم صالح الأعمال"}</p>
      </div>
    `;

    // Wait for layout to settle, then auto-fit the name to keep it on one line.
    requestAnimationFrame(autoFitName);
  }

  // --------------------------- Event Handlers ---------------------------

  $name.addEventListener("input", (e) => {
    state.name = e.target.value;
    renderCard();
  });

  $message.addEventListener("input", (e) => {
    state.message = e.target.value;
    renderCard();
  });

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.image = ev.target.result;
      $filePreviewImg.src = state.image;
      $filePreview.hidden = false;
      const content = $fileDrop.querySelector(".file-drop-content");
      if (content) content.style.display = "none";

      // Pre-decode the image in the browser cache so the very first download
      // already has the photo (no need for a second click).
      const warm = new Image();
      warm.src = state.image;
      if (warm.decode) warm.decode().catch(() => {});

      renderCard();
    };
    reader.readAsDataURL(file);
  }

  $image.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleFile(file);
  });

  ["dragenter", "dragover"].forEach((ev) =>
    $fileDrop.addEventListener(ev, (e) => {
      e.preventDefault();
      $fileDrop.classList.add("is-dragging");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    $fileDrop.addEventListener(ev, (e) => {
      e.preventDefault();
      $fileDrop.classList.remove("is-dragging");
    })
  );
  $fileDrop.addEventListener("drop", (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });

  $templateGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".template-thumb");
    if (!btn) return;
    const tpl = btn.getAttribute("data-template");
    if (!tpl) return;
    state.template = tpl;
    $templateGrid.querySelectorAll(".template-thumb").forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-checked", active ? "true" : "false");
    });
    renderCard();
  });

  // --------------------------- Download ---------------------------

  // Cache for embedded Google Fonts CSS (with font-face data URIs).
  let cachedFontCSS = null;

  /**
   * Wrap a fetch with a hard timeout so a slow network can't hang the
   * whole download flow.
   */
  function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() =>
      clearTimeout(id)
    );
  }

  /**
   * Fetch the Google Fonts CSS used by the page and inline every woff2 file
   * as a base64 data URI. This bypasses CORS restrictions that prevent
   * htmlToImage from reading cssRules of cross-origin stylesheets.
   *
   * If anything fails (offline, slow network, blocked CDN) we return an
   * empty string — the exported PNG will then fall back to system fonts,
   * but the user will still get a working download.
   */
  async function buildEmbeddedFontCSS() {
    if (cachedFontCSS !== null) return cachedFontCSS;

    const FONTS_CSS_URL =
      "https://fonts.googleapis.com/css2" +
      "?family=Amiri:wght@400;700" +
      "&family=Aref+Ruqaa:wght@400;700" +
      "&family=Cairo:wght@300;400;600;700;900" +
      "&family=Reem+Kufi:wght@400;500;600;700" +
      "&family=Lateef:wght@400;700" +
      "&display=swap";

    try {
      const cssResp = await fetchWithTimeout(FONTS_CSS_URL, { mode: "cors" }, 5000);
      if (!cssResp.ok) throw new Error("Failed to fetch fonts CSS");
      let cssText = await cssResp.text();

      const urlMatches = [...cssText.matchAll(/url\((https?:[^)]+)\)/g)];
      const uniqueUrls = [...new Set(urlMatches.map((m) => m[1]))];

      const replacements = await Promise.all(
        uniqueUrls.map(async (url) => {
          try {
            const r = await fetchWithTimeout(url, { mode: "cors" }, 5000);
            const blob = await r.blob();
            const dataUri = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            return [url, dataUri];
          } catch (e) {
            console.warn("Font file fetch failed:", url, e);
            return [url, null];
          }
        })
      );

      for (const [url, dataUri] of replacements) {
        if (dataUri) cssText = cssText.split(url).join(dataUri);
      }

      cachedFontCSS = cssText;
    } catch (err) {
      console.warn("Embedded font CSS build failed:", err);
      cachedFontCSS = "";
    }
    return cachedFontCSS;
  }

  /**
   * Detect WebViews / in-app browsers (WhatsApp, Instagram, Facebook, TikTok,
   * LinkedIn) where the <a download> attribute is silently ignored. In that
   * case we fall back to opening the image in a new tab so the user can
   * long-press to save.
   */
  function isInAppBrowser() {
    const ua = navigator.userAgent || "";
    return /(FBAN|FBAV|Instagram|Line|MicroMessenger|WhatsApp|TikTok|Snapchat|Twitter|LinkedIn)/i.test(ua);
  }

  /**
   * Convert a data URL to a Blob so we can use object URLs which are more
   * reliable than huge data URLs (especially on Safari/iOS).
   */
  function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(",");
    const mime = (header.match(/data:([^;]+)/) || [])[1] || "image/png";
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function downloadCard() {
    if (typeof htmlToImage === "undefined") {
      alert("تعذّر تحميل أداة التصدير. تأكد من اتصالك بالإنترنت.");
      return;
    }
    $downloadBtn.disabled = true;
    const originalLabel = $downloadBtn.innerHTML;
    $downloadBtn.innerHTML = "جاري التحضير…";

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Make sure every <img> inside the card is fully decoded BEFORE we ask
      // html-to-image to clone the DOM. Otherwise on the first download right
      // after a file pick, the cloned <img> serializes empty.
      const imgs = Array.from($card.querySelectorAll("img"));
      await Promise.all(
        imgs.map(async (img) => {
          if (img.decode) {
            try { await img.decode(); } catch (_) { /* ignore */ }
          } else if (!img.complete) {
            await new Promise((res) => {
              img.addEventListener("load", res, { once: true });
              img.addEventListener("error", res, { once: true });
            });
          }
        })
      );

      const fontEmbedCSS = await buildEmbeddedFontCSS();

      const rect = $card.getBoundingClientRect();
      const renderOpts = {
        width: rect.width,
        height: rect.height,
        cacheBust: false,
        backgroundColor: null,
        fontEmbedCSS,
        skipFonts: false,
      };

      // Warm-up pass: forces the SVG foreignObject to materialize fonts and
      // images so the high-DPI pass below is consistent.
      try {
        await htmlToImage.toPng($card, { ...renderOpts, pixelRatio: 1 });
      } catch (warmErr) {
        console.warn("Warm-up render failed (continuing):", warmErr);
      }

      const dataUrl = await htmlToImage.toPng($card, {
        ...renderOpts,
        pixelRatio: 2,
      });

      if (!dataUrl || dataUrl.length < 1000) {
        throw new Error("Empty image data returned");
      }

      const blob = dataUrlToBlob(dataUrl);
      const safeName = (state.name || "بطاقة").replace(/[\\/:*?"<>|]/g, "").trim() || "بطاقة";
      const filename = `بطاقة-عيد-الأضحى-${safeName}.png`;

      if (isInAppBrowser()) {
        // In-app browsers ignore <a download> silently. Open the PNG so the
        // user can long-press → "Save Image".
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank");
        if (!win) {
          alert("لحفظ الصورة: افتح المتصفح (سفاري/كروم) أولاً ثم أعد المحاولة، أو اضغط مطوّلاً على الصورة بعد فتحها.");
        }
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } else {
        triggerDownload(blob, filename);
      }
    } catch (err) {
      console.error("Download failed:", err);
      alert("حدث خطأ أثناء التصدير. حاول إعادة تحميل الصفحة ثم المحاولة من جديد.");
    } finally {
      $downloadBtn.disabled = false;
      $downloadBtn.innerHTML = originalLabel;
    }
  }

  $downloadBtn.addEventListener("click", downloadCard);

  // --------------------------- Init ---------------------------
  renderCard();
})();
