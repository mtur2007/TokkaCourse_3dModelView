// カテゴリのイントロを複数回走らせないためのフラグ。
let hasRevealedCategories = false;

function revealCategories() {
  if (hasRevealedCategories) return;
  hasRevealedCategories = true;
  // カテゴリ見出しとボタンのCSSアニメを開始する。
  document.body.classList.add("is-category-visible");
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
} else {
  setupHeaderIntro();
}
