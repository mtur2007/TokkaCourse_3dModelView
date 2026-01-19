
import { school_VewStart, school_VewStop } from './School3D.js';
import { ball_VewStart, ball_VewStop } from './boll.js';
import { horror_VewStart, horror_VewStop } from './horror.js';
import { eventData } from './eventData.js';

let User_Device = undefined;
let User_Vew = undefined;

const schoolBtn = document.getElementById("school");
const horrorBtn = document.getElementById("horror");
const ballBtn = document.getElementById("ball");

const school_ctl = document.getElementById("school-ctl");
const horror_ctl = document.getElementById("horror-ctl");
const ball_ctl = document.getElementById("ball-ctl");

schoolBtn.style.display = "block";
horrorBtn.style.display = "block";
ballBtn.style.display = "block";

const toggleBtn = document.getElementById("toggle-daynight");
toggleBtn.style.display = "none";

const imageText = document.getElementById("online");
const online_sub = document.getElementById("main-operation");

const fesLayerTargets = document.querySelectorAll(
    ".fes-sub, .fes-year, .fes-shadow-sub, .fes-shadow-year"
);
fesLayerTargets.forEach((el) => {
    el.addEventListener(
        "animationstart",
        () => {
            el.classList.add("fes-raise");
        },
        { once: true }
    );
});

document.getElementById('expand-btn').style.display = 'none';
document.getElementById('controller-area').style.display = 'none';
document.getElementById('controller').style.display = 'none';
document.getElementById('speed-up').style.display = 'none';
document.getElementById('btn-up').style.display = 'none';
document.getElementById('btn-down').style.display = 'none';

const three_section = document.getElementById("three-section");
const schoolIframe = document.getElementById("school-iframe");
const area = document.getElementById("three-canvas");

if (three_section) {
    three_section.style.display = "none";
}
const LINE_GAP_RATIO = 0;
const LINE_TEXT_PADDING_RATIO = 0;
const LINE_GAP_PX = 6;
const LINE_RIGHT_GAP_RATIO = 0;
const LINE_X_SCALE_RATIO = 0.35;
const LINE_Y_OFFSET_TOP = -5;
const LINE_Y_OFFSET_BOTTOM = -5;
const MEASURE_IGNORE_ANIM = true;
const SHOW_LINE_GUIDES = false;
const MEASURE_CLONE_ATTR = "data-measure-clone";

function measureWithNoAnim(el, measureFn) {
    if (!MEASURE_IGNORE_ANIM || !el) return measureFn();
    const prevAnimation = el.style.animation;
    const prevTransition = el.style.transition;
    const prevTransform = el.style.transform;
    el.style.animation = "none";
    el.style.transition = "none";
    el.style.transform = "none";
    const result = measureFn();
    el.style.animation = prevAnimation;
    el.style.transition = prevTransition;
    el.style.transform = prevTransform;
    return result;
}

function getRectForLayout(el) {
    return measureWithNoAnim(el, () => el.getBoundingClientRect());
}

function getHeaderMeasureContainer() {
    let container = document.querySelector(".header-measure-container");
    if (container) return container;
    const headerContainer = document.querySelector(".header-container");
    if (!headerContainer) return null;
    container = document.createElement("div");
    container.className = "header-measure-container";
    Object.assign(container.style, {
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
        visibility: "hidden",
        zIndex: "0",
    });
    headerContainer.appendChild(container);
    return container;
}

function ensureMeasureClone(el, key) {
    if (!el) return null;
    const container = getHeaderMeasureContainer();
    if (!container) return null;
    let clone = container.querySelector(`[${MEASURE_CLONE_ATTR}="${key}"]`);
    if (!clone) {
        clone = el.cloneNode(true);
        clone.removeAttribute("id");
        clone.setAttribute(MEASURE_CLONE_ATTR, key);
        clone.setAttribute("aria-hidden", "true");
        container.appendChild(clone);
    }

    const headerRect = getRectForLayout(container);
    const elRect = getRectForLayout(el);
    const left = elRect.left - headerRect.left;
    const top = elRect.top - headerRect.top;
    Object.assign(clone.style, {
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        margin: "0",
        pointerEvents: "none",
        visibility: "hidden",
        animation: "none",
        transition: "none",
        transform: "none",
    });
    return clone;
}

function getTextRight(el) {
    if (!el) return 0;
    return measureWithNoAnim(el, () => {
        if (!el.firstChild || !document.createRange) return el.getBoundingClientRect().right;
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = range.getClientRects();
        if (!rects || rects.length === 0) return el.getBoundingClientRect().right;
        return rects[rects.length - 1].right;
    });
}

function updateHeaderLinePoints() {
    const svg = document.querySelector(".header-lines");
    if (!svg) return;
    const lineMain = document.getElementById("header-line-main");
    const lineShadow = document.getElementById("header-line-shadow");
    const yearMain = document.querySelector(".fes-year");
    const yearShadow = document.querySelector(".fes-shadow-year");
    const yearMain6 = document.querySelector(".fes-year-6");
    const yearShadow6 = document.querySelector(".fes-shadow-year-6");
    const fesMain = document.querySelector(".fes-sub");
    const fesShadow = document.querySelector(".fes-shadow-sub");
    const fesMainS = document.querySelector(".fes-sub-s");
    const fesShadowS = document.querySelector(".fes-shadow-sub-s");
    if (!lineMain || !lineShadow || !yearMain || !yearShadow || !yearMain6 || !yearShadow6 || !fesMain || !fesShadow || !fesMainS || !fesShadowS) return;

    const svgRect = svg.getBoundingClientRect();
    const width = svgRect.width;
    const height = svgRect.height;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const yearMainClone = ensureMeasureClone(yearMain, "fes-year");
    const yearShadowClone = ensureMeasureClone(yearShadow, "fes-shadow-year");
    const yearMain6Clone = ensureMeasureClone(yearMain6, "fes-year-6");
    const yearShadow6Clone = ensureMeasureClone(yearShadow6, "fes-shadow-year-6");
    const fesMainClone = ensureMeasureClone(fesMain, "fes-sub");
    const fesShadowClone = ensureMeasureClone(fesShadow, "fes-shadow-sub");
    const fesMainSClone = ensureMeasureClone(fesMainS, "fes-sub-s");
    const fesShadowSClone = ensureMeasureClone(fesShadowS, "fes-shadow-sub-s");
    const yearMainRect = getRectForLayout(yearMainClone || yearMain);
    const yearShadowRect = getRectForLayout(yearShadowClone || yearShadow);
    const yearMain6Rect = getRectForLayout(yearMain6Clone || yearMain6);
    const yearShadow6Rect = getRectForLayout(yearShadow6Clone || yearShadow6);
    const fesMainRect = getRectForLayout(fesMainClone || fesMain);
    const fesShadowRect = getRectForLayout(fesShadowClone || fesShadow);
    const fesMainSRect = getRectForLayout(fesMainSClone || fesMainS);
    const fesShadowSRect = getRectForLayout(fesShadowSClone || fesShadowS);

    const toSvgPoint = (x, y) => {
        if (!svg.createSVGPoint || !svg.getScreenCTM) {
            return { x: x - svgRect.left, y: y - svgRect.top };
        }
        const pt = svg.createSVGPoint();
        pt.x = x;
        pt.y = y;
        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: x - svgRect.left, y: y - svgRect.top };
        const res = pt.matrixTransform(ctm.inverse());
        return { x: res.x, y: res.y };
    };
    const gapPx = width * LINE_GAP_RATIO + width * LINE_TEXT_PADDING_RATIO + LINE_GAP_PX;
    const rightGapPx = width * LINE_RIGHT_GAP_RATIO;
    const rightEdgeX = toSvgPoint(svgRect.right - rightGapPx, svgRect.top).x;
    const scaleX = (x) => x * (1 + LINE_X_SCALE_RATIO);

    const yearUnionRight = Math.max(yearMain6Rect.right, yearShadow6Rect.right);
    const yearUnionTop = Math.min(yearMainRect.top, yearShadowRect.top);
    const yearUnionBottom = Math.max(yearMainRect.bottom, yearShadowRect.bottom);
    const lineStroke = parseFloat(getComputedStyle(lineMain).strokeWidth) || 0;
    const strokeInsetPx = lineStroke * 0.5;
    const lineStartScreenX = yearUnionRight + gapPx - strokeInsetPx;
    const yearCenterScreenX = lineStartScreenX;
    const yearCenterScreenY = yearUnionTop + (yearUnionBottom - yearUnionTop) * 0.5;
    const yearCenter = toSvgPoint(yearCenterScreenX, yearCenterScreenY);

    const fesMainRight = fesMainSRect.right;
    const fesMainPoint = toSvgPoint(fesMainRight + gapPx - strokeInsetPx, fesMainRect.top);
    const fesMainX = fesMainPoint.x;
    const fesMainY = fesMainPoint.y - LINE_Y_OFFSET_TOP;

    const fesShadowRight = fesShadowSRect.right;
    const fesShadowPoint = toSvgPoint(fesShadowRight + gapPx - strokeInsetPx, fesShadowRect.bottom);
    const fesShadowX = fesShadowPoint.x;
    const fesShadowY = fesShadowPoint.y + LINE_Y_OFFSET_BOTTOM;

    lineMain.setAttribute(
        "points",
        `${scaleX(yearCenter.x).toFixed(2)},${yearCenter.y.toFixed(2)} ${scaleX(fesMainX).toFixed(2)},${fesMainY.toFixed(2)} ${scaleX(rightEdgeX).toFixed(2)},${fesMainY.toFixed(2)}`
    );
    lineShadow.setAttribute(
        "points",
        `${scaleX(yearCenter.x).toFixed(2)},${yearCenter.y.toFixed(2)} ${scaleX(fesShadowX).toFixed(2)},${fesShadowY.toFixed(2)} ${scaleX(rightEdgeX).toFixed(2)},${fesShadowY.toFixed(2)}`
    );

    if (SHOW_LINE_GUIDES) {
        const existing = svg.querySelectorAll(".line-guide");
        existing.forEach((el) => el.remove());
        const addGuide = (x, y, h, color) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("class", "line-guide");
            line.setAttribute("x1", x.toFixed(2));
            line.setAttribute("x2", x.toFixed(2));
            line.setAttribute("y1", Math.max(0, y - h * 0.5).toFixed(2));
            line.setAttribute("y2", Math.max(0, y + h * 0.5).toFixed(2));
            line.setAttribute("stroke", color);
            line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke-dasharray", "6 4");
            svg.appendChild(line);
        };
        addGuide(yearCenter.x, yearCenter.y, 80, "#ff3366");
        addGuide(fesMainX, fesMainY, 80, "#33aa55");
        addGuide(fesShadowX, fesShadowY, 80, "#3388ff");
    }
}

updateHeaderLinePoints();
window.addEventListener("resize", updateHeaderLinePoints);

function logHeaderTextPositions() {
    const targets = [
        { label: "OCHANOMIZU", el: document.querySelector(".fes-main") },
        { label: "FES", el: document.querySelector(".fes-sub") },
        { label: "2026", el: document.querySelector(".fes-year") },
    ];

    const rows = targets
        .filter(({ el }) => el)
        .map(({ label, el }) => {
            const rect = el.getBoundingClientRect();
            return {
                label,
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
            };
        });

    console.table(rows);
}

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(logHeaderTextPositions);
} else {
    window.addEventListener("load", logHeaderTextPositions);
}

function VewStop(){
    // if (User_Vew === 'school'){
    //     school_VewStop();
    // } else if (User_Vew === 'horror'){
    //     horror_VewStop();
    // } else if (User_Vew === 'ball'){
    //     ball_VewStop();
    // }
    school_VewStop();
    horror_VewStop();
    ball_VewStop();
    
}

function VewStart(){
    if (User_Vew === 'school'){
        school_VewStart();
    } else if (User_Vew === 'horror'){
        horror_VewStart();
    } else if (User_Vew === 'ball'){
        ball_VewStart();
    }
}

// 共通の処理
function selectDevice(type) {

    VewStop();

    User_Vew = type;

    if (three_section) {
        three_section.style.display = "block";
    }

    // ボタンを両方消す
    // phoneBtn.style.display = "none";
    // pcBtn.style.display = "none";

    if (User_Vew === 'school'){

      area.style.touchAction = 'none';

      imageText.textContent = "【 学校探検 】";
      online_sub.innerHTML = "\\ バーチャル学校見学 /";

      horror_ctl.style.display = "none";
      ball_ctl.style.display = "none";
      school_ctl.style.display = "grid";

      console.log(school_ctl.style.display)
      
      toggleBtn.style.display = "none";
      document.getElementById('expand-btn').style.display = 'none';
      document.getElementById('controller-area').style.display = 'none';
      document.getElementById('controller').style.display = 'none';
      document.getElementById('speed-up').style.display = 'none';
      document.getElementById('btn-up').style.display = 'none';
      document.getElementById('btn-down').style.display = 'none';
      three_section.style.display = "block";

      toggleBtn.textContent = "🟡描画中...";
      area.style.display = "none";
      if (schoolIframe) schoolIframe.style.display = "block";
      requestAnimationFrame(() => school_VewStop());

    } else if(User_Vew === 'horror'){
      three_section.style.display = "block";
      
      area.style.touchAction = 'none';
      imageText.innerHTML = "【 お化け屋敷 】";
      online_sub.innerHTML = "廃校となった校舎を舞台にしたホラー体験施設。<br>薄暗い廊下と教室に潜む恐怖があなたを待っています｡<br>⚠️音をお付けください。⚠️<br>⚠️心臓の弱い方はご遠慮ください。⚠️";

      ball_ctl.style.display = "none";
      school_ctl.style.display = "none";
      horror_ctl.style.display = "grid";

      toggleBtn.style.display = "block";
      document.getElementById('expand-btn').style.display = 'block';
      document.getElementById('controller-area').style.display = 'block';
      document.getElementById('controller').style.display = 'block';
      document.getElementById('speed-up').style.display = 'none';
      document.getElementById('btn-up').style.display = 'none';
      document.getElementById('btn-down').style.display = 'none';

      toggleBtn.textContent = "🟡描画中...";
      area.style.display = "block";
      if (schoolIframe) schoolIframe.style.display = "none";
      requestAnimationFrame(() => horror_VewStart(true));

    } else if (User_Vew === 'ball') {
      
      area.style.touchAction = 'none';

      imageText.innerHTML = "【 ボール遊び 】";
      online_sub.innerHTML = "台を傾けてボールをゴールへ入れよう！";
      
      school_ctl.style.display = "none";
      horror_ctl.style.display = "none";
      ball_ctl.style.display = "grid";

      toggleBtn.style.display = "block";
      document.getElementById('expand-btn').style.display = 'none';
      document.getElementById('controller-area').style.display = 'none';
      document.getElementById('controller').style.display = 'none';
      document.getElementById('speed-up').style.display = 'none';
      document.getElementById('btn-up').style.display = 'none';
      document.getElementById('btn-down').style.display = 'none';

      three_section.style.display = "block";

      toggleBtn.textContent = "🟡描画中...";
      area.style.display = "block";
      if (schoolIframe) schoolIframe.style.display = "none";
      requestAnimationFrame(() => ball_VewStart(true));

    }

    console.log("User_Vew:", User_Vew);
}

// desc_panel.style.display = "block";  // 表示

window.addEventListener('pointerdown', (e) => {
  handlePointer(e, "DOWN");
});
      
window.addEventListener('mousemove', (e) => {
  handlePointer(e, "MOVE");
});      

const canvas1 = document.getElementById('three-section');
let BeforeSection = undefined;

function handlePointer(e, source) {
  const el = document.elementFromPoint(e.clientX, e.clientY);

  // ① キャンバス判定
  const OnSection = el?.closest("section")?.id || "SectionOut";
  if (BeforeSection != OnSection){
    // console.log('外' + BeforeSection + ' : ' + '内' + OnSection)
  
    if (BeforeSection === 'three-section' && User_Vew !== undefined){
      toggleBtn.textContent = `🔴描画停止中.`;

      VewStop();

    }

    if (OnSection === 'three-section' && User_Vew !== undefined){
      toggleBtn.textContent = "🟡描画中...";
      
      VewStart();

    }
    // if (OnSection === 'shop'){
    //   desc_panel.style.display = 'block';
    // }
  
  }

  BeforeSection = OnSection

}

function addTapEvent(element, callback) {
  element.addEventListener("click", callback);
  element.addEventListener("touchstart", callback);
}

addTapEvent(schoolBtn, () => selectDevice("school"));
addTapEvent(horrorBtn, () => selectDevice("horror"));
addTapEvent(ballBtn,   () => selectDevice("ball"));


// 詳細ウィンドウの表示・非表示 =========================================
class DetailWindow {
  constructor() {
    this.window = document.getElementById('detail-window');
    this.content = document.getElementById('detail-content');
    this.closeBtn = document.getElementById('close-detail');
    this.currentItem = null;
    
    this.init();
  }

  init() {
    // 閉じるボタンのイベント
    this.closeBtn.addEventListener('click', () => this.hide());
    this.closeBtn.addEventListener('touchstart', () => this.hide());
    
    // ウィンドウ外をクリックで閉じる
    this.window.addEventListener('click', (e) => {
      if (e.target === this.window) {
        this.hide();
      }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.window.classList.contains('show')) {
        this.hide();
      }
    });
  }

  show(eventId) {
    const data = eventData[eventId];
    if (!data) return;

    this.currentItem = eventId;
    this.content.innerHTML = this.generateContent(data);
    this.window.classList.add('show');
    
    // アクティブ状態を更新
    document.querySelectorAll('.item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-id="${eventId}"]`)?.classList.add('active');
  }

  hide() {
    this.window.classList.remove('show');
    this.currentItem = null;
    
    // アクティブ状態を解除
    document.querySelectorAll('.item').forEach(item => {
      item.classList.remove('active');
    });
  }

  generateContent(data) {
    const featuresHTML = data.features
      ? `<div style="margin: 20px 0;">
           <strong style="color: #667eea; font-size: 18px;">✨ 見どころ・特徴</strong>
           <ul style="margin: 10px 0; padding-left: 20px; line-height: 2;">
             ${data.features.map(f => `<li>${f}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const imageHTML = data.imageUrl
      ? `<img src="${data.imageUrl}" alt="${data.imageAlt || data.title}" />`
      : (data.image || '');

    return `
      <h2 class="detail-title">${data.title}</h2>
      
      <div class="detail-image">
        ${imageHTML}
      </div>
      
      <div class="detail-info">
        ${data.category ? `<span class="detail-label">カテゴリー:</span><span>${data.category}</span>` : ''}
        ${data.grade ? `<span class="detail-label">担当:</span><span>${data.grade}</span>` : ''}
        ${data.club ? `<span class="detail-label">担当:</span><span>${data.club}</span>` : ''}
        <span class="detail-label">場所:</span><span>${data.location}</span>
        <span class="detail-label">時間:</span><span>${data.time}</span>
        <span class="detail-label">料金:</span><span>${data.price}</span>
        <span class="detail-label">定員:</span><span>${data.capacity}</span>
      </div>
      
      <div class="detail-description">
        ${data.description}
      </div>
      
      ${featuresHTML}
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f0ff; border-radius: 10px;">
        <p style="font-size: 14px; color: #667eea; margin: 0;">
          💡 詳しい情報は当日会場でお尋ねください
        </p>
      </div>
    `;
  }
}

// 初期化
const detailWindow = new DetailWindow();

// 出し物アイテムのイベント設定
document.querySelectorAll('.item[data-id]').forEach(item => {
  const eventId = item.dataset.id;
  
  // クリック・タップイベント
  item.addEventListener('click', () => {
    detailWindow.show(eventId);
  });
  
  // ホバーイベント（PCのみ）
//   if (window.innerWidth > 768) {
//     item.addEventListener('mouseenter', () => {
//       detailWindow.show(eventId);
//     });
//   }
});

// // カテゴリーボタンのスクロール機能
// document.getElementById('btn-food')?.addEventListener('click', () => {
//   VewStop();
//   document.querySelector('#shop .shop-section:nth-child(3)')?.scrollIntoView({ behavior: 'smooth' });
// });

// document.getElementById('btn-art')?.addEventListener('click', () => {
//   VewStop();
//   document.querySelector('#shop .shop-section:nth-child(1)')?.scrollIntoView({ behavior: 'smooth' });
// });

// document.getElementById('btn-attraction')?.addEventListener('click', () => {
//   VewStop();
//   document.querySelector('#shop .shop-section:nth-child(2)')?.scrollIntoView({ behavior: 'smooth' });
// });

// document.getElementById('btn-club')?.addEventListener('click', () => {
//   VewStop();
//   document.querySelector('#shop .shop-section:nth-child(4)')?.scrollIntoView({ behavior: 'smooth' });
// });

// document.getElementById('btn-time')?.addEventListener('click', () => {
//   VewStop();
//   document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' });
// });

// document.getElementById('btn-map')?.addEventListener('click', () => {
//   VewStop();
//   document.getElementById('access')?.scrollIntoView({ behavior: 'smooth' });
// });

// 拡大ボタン
document.getElementById('expand-btn')?.addEventListener('click', function() {
  this.hidden = true;
  document.getElementById('shrink-btn').hidden = false;
});

document.getElementById('shrink-btn')?.addEventListener('click', function() {
  this.hidden = true;
  document.getElementById('expand-btn').hidden = false;
});

// コントローラーのドラッグ機能
// const controller = document.getElementById('controller');
// if (controller) {
//   let isDragging = false;

//   controller.addEventListener('mousedown', () => isDragging = true);
//   controller.addEventListener('touchstart', () => isDragging = true);
  
//   document.addEventListener('mouseup', () => isDragging = false);
//   document.addEventListener('touchend', () => isDragging = false);
  
//   document.addEventListener('mousemove', (e) => {
//     if (isDragging) {
//       controller.style.left = (e.clientX - 15) + 'px';
//       controller.style.bottom = (window.innerHeight - e.clientY - 15) + 'px';
//     }
//   });

//   document.addEventListener('touchmove', (e) => {
//     if (isDragging && e.touches[0]) {
//       const touch = e.touches[0];
//       controller.style.left = (touch.clientX - 15) + 'px';
//       controller.style.bottom = (window.innerHeight - touch.clientY - 15) + 'px';
//     }
//   });
// }

// スムーススクロール
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
