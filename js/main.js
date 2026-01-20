
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
