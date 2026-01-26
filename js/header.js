// カテゴリのイントロを複数回走らせないためのフラグ。
let hasRevealedCategories = false;

function revealCategories() {
  if (hasRevealedCategories) return;
  hasRevealedCategories = true;
  // カテゴリ見出しとボタンのCSSアニメを開始する。
  document.body.classList.add("is-category-visible");
}

function setupThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;
  const root = document.documentElement;
  const storageKey = "theme";
  const header = document.querySelector("header");
  const originalParent = toggle.parentElement;
  const originalNextSibling = toggle.nextElementSibling;

  const getAutoTheme = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "light" : "dark";
  };

  const applyTheme = (theme, isAuto) => {
    root.setAttribute("data-theme", theme);
    toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    toggle.textContent = isAuto ? `${theme.toUpperCase()} AUTO` : theme.toUpperCase();
  };

  const storedTheme = localStorage.getItem(storageKey);
  const initialTheme = storedTheme || getAutoTheme();
  applyTheme(initialTheme, !storedTheme);

  toggle.addEventListener("pointerdown", () => {
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(storageKey, next);
    applyTheme(next, false);
  });

  window.setInterval(() => {
    if (localStorage.getItem(storageKey)) return;
    applyTheme(getAutoTheme(), true);
  }, 5 * 60 * 1000);

  const moveToggle = (floating) => {
    toggle.classList.toggle("is-floating", floating);
    if (!originalParent) return;
    if (floating) {
      if (toggle.parentElement !== document.body) {
        document.body.appendChild(toggle);
      }
    } else if (toggle.parentElement !== originalParent) {
      if (originalNextSibling) {
        originalParent.insertBefore(toggle, originalNextSibling);
      } else {
        originalParent.appendChild(toggle);
      }
    }
  };

  const updateFloating = () => {
    if (!header) return;
    const rect = header.getBoundingClientRect();
    moveToggle(rect.bottom <= 8);
  };

  updateFloating();
  window.addEventListener("scroll", updateFloating, { passive: true });
  window.addEventListener("resize", updateFloating);
}

function setupInfoIconAnimation() {
  const canvas = document.querySelector(".info-icon-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const img = new Image();
  const baseCanvas = document.createElement("canvas");
  const baseCtx = baseCanvas.getContext("2d");
  if (!baseCtx) return;
  const dpr = window.devicePixelRatio || 1;

  const resizeCanvas = () => {
    const cssWidth = canvas.clientWidth || canvas.width;
    const cssHeight = canvas.clientHeight || canvas.height;
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    baseCanvas.width = canvas.width;
    baseCanvas.height = canvas.height;
  };

  const renderBase = () => {
    const width = baseCanvas.width;
    const height = baseCanvas.height;
    baseCtx.setTransform(1, 0, 0, 1, 0, 0);
    baseCtx.clearRect(0, 0, width, height);

    const imgW = img.naturalWidth || img.width || 1;
    const imgH = img.naturalHeight || img.height || 1;
    const scale = Math.min(width / imgW, height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (width - drawW) * 0.5;
    const offsetY = (height - drawH) * 0.5;
    baseCtx.drawImage(img, offsetX, offsetY, drawW, drawH);
  };

  if (reducedMotion) {
    img.onload = () => {
      resizeCanvas();
      renderBase();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseCanvas, 0, 0);
    };
    img.src = "icon/information.png";
    return;
  }

  const loop = 360;
  const minY = 0.45;
  const maxY = 0.9;
  const degreesPerMs = 0.08;

  const drawFrame = (time) => {
    const rotation = (time * degreesPerMs) % loop;
    const rad = rotation * (Math.PI / 180);
    const scaleX = Math.cos(rad + 90 * (Math.PI / 180));
    const flat = Math.abs(rotation - (loop / 2)) / (loop / 2);

    const leftY = (minY + (maxY - minY) * flat) * 1.5;
    const rightY = (minY + (maxY - minY) * (1 - flat)) * 1.5;

    const width = canvas.width;
    const height = canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, 0);
    ctx.scale(scaleX, 1);
    ctx.translate(-width / 2, 0);

    const columnWidth = 1;
    for (let x = 0; x < width; x += columnWidth) {
      const t = width <= 1 ? 0.5 : x / (width - 1);
      const eased = t * t * (3 - 2 * t);
      const scaleY = leftY + (rightY - leftY) * eased;
      const destY = (height - height * scaleY) * 0.5;
      const destH = height * scaleY;
      ctx.drawImage(baseCanvas, x, 0, columnWidth, height, x, destY, columnWidth, destH);
    }

    ctx.restore();

    window.requestAnimationFrame(drawFrame);
  };

  img.onload = () => {
    resizeCanvas();
    renderBase();
    window.requestAnimationFrame(drawFrame);
  };
  img.src = "icon/information.png";
  window.addEventListener("resize", () => {
    resizeCanvas();
    renderBase();
  });
}

function setupHeaderIntro() {
  const header = document.querySelector("header");
  const headerContainer = document.querySelector(".header-container");
  
  const headerLeft = document.querySelector(".header-left");

  // if (!header || !headerContainer) {
  //   // ヘッダーが無い場合は即表示する。
  //   revealCategories();
  //   return;
  // }

  const headerRect = header.getBoundingClientRect();
  const containerRect = headerContainer.getBoundingClientRect();

  const leftRect = headerLeft.getBoundingClientRect();


  // header-leftを基準に点を作り、header-containerのSVG座標へ変換する。
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;
  const originX = leftRect.left - containerRect.left;
  const originY = leftRect.top - containerRect.top;

  const width = leftRect.width;
  const height = leftRect.height;
  const centerY = height * 0.5;

  const toViewBox = (x, y) =>
    `${(x / containerWidth * 100).toFixed(2)},${(y / containerHeight * 100).toFixed(2)}`;

  // header-left内のローカル座標。
  const localA = { x: width * 0.5, y: centerY };
  const localTop = { x: width * 0.3, y: centerY - height * 0.3 };
  const localBottom = { x: width * 0.3, y: centerY + height * 0.3 };

  // header-left基準 → header-container基準に変換。
  const pointA = toViewBox(originX + localA.x, originY + localA.y);
  const pointTop = toViewBox(originX + localTop.x, originY + localTop.y);
  const pointBottom = toViewBox(originX + localBottom.x, originY + localBottom.y);
  const endTop = toViewBox(containerWidth, originY + localTop.y);
  const endBottom = toViewBox(containerWidth, originY + localBottom.y);


  const lineMain = document.querySelector("#header-line-main");
  const lineShadow = document.querySelector("#header-line-shadow");

  lineMain.setAttribute("points", `${pointA} ${pointTop} ${endTop}`);
  lineShadow.setAttribute("points", `${pointA} ${pointBottom} ${endBottom}`);

  // ヘッダーの高さから、落ち着く位置までのオフセットを計算する。
  const offset = Math.max(0, headerRect.height * 0.5 - containerRect.height * 0.5);
  headerContainer.style.setProperty("--header-intro-offset", `${offset}px`);
  console.log(`Header intro offset: ${offset}px`);
  // ヘッダーのイントロアニメを開始する。
  document.body.classList.add("is-header-intro");

  const onIntroEnd = (event) => {
    if (event.target !== headerContainer || event.animationName !== "headerIntroSettle") return;
    // ヘッダーが落ち着いたらカテゴリを表示する。
    revealCategories();
    headerContainer.removeEventListener("animationend", onIntroEnd);
  };
  headerContainer.addEventListener("animationend", onIntroEnd);

  // animationendが発火しない場合の保険タイマー。
  // window.setTimeout(revealCategories, 1800);
}

if (document.readyState === "loading") {
  // DOM準備完了後にレイアウト計測してイントロを開始する。
  window.addEventListener("DOMContentLoaded", setupHeaderIntro);
  window.addEventListener("DOMContentLoaded", setupInfoIconAnimation);
  window.addEventListener("DOMContentLoaded", setupThemeToggle);
} else {
  setupHeaderIntro();
  setupInfoIconAnimation();
  setupThemeToggle();
}
