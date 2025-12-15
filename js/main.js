// main.js : カーソルやマウスがどのセクションの上に位置しているかを監視するファイル(3Dビューの有効/無効の判断)

// メインウィンドウ
import { VewStart, VewStop } from './School3D.js';

let User_Device = undefined;

const phoneBtn = document.getElementById("phone");
const pcBtn = document.getElementById("pc");

const toggleBtn = document.getElementById("toggle-daynight");
toggleBtn.style.display = "none";

const imageText = document.getElementById("imageText");

document.getElementById('expand-btn').style.display = 'none';
document.getElementById('controller-area').style.display = 'none';
document.getElementById('controller').style.display = 'none';
document.getElementById('speed-up').style.display = 'none';
document.getElementById('btn-up').style.display = 'none';
document.getElementById('btn-down').style.display = 'none';

const area = document.getElementById("three-canvas");

// 共通の処理
function selectDevice(type) {
    User_Device = type;

    // ボタンを両方消す
    phoneBtn.style.display = "none";
    pcBtn.style.display = "none";

    if (User_Device === 'pc'){

      area.style.touchAction = 'none';

      imageText.textContent = "【 |/_ 3DVew - let's 学校探検 (探索時は右上の拡大表示を使用してください。) 】";

      toggleBtn.style.display = "block";
      document.getElementById('expand-btn').style.display = 'block';
      document.getElementById('controller-area').style.display = 'block';
      document.getElementById('controller').style.display = 'block';
      document.getElementById('speed-up').style.display = 'block';
      document.getElementById('btn-up').style.display = 'block';
      document.getElementById('btn-down').style.display = 'block';

      toggleBtn.textContent = "🟡描画中...";
      VewStart();

    } else {
      
      imageText.textContent = "【 |_ ヒーロー画像 ( タブレットまたはPCで 3D描画が可能です。帰宅後にぜひ試してみたください！ ) 】";
    }

    console.log("User_Device:", User_Device);
}

const items = document.querySelectorAll(".item");
const descPanel = document.getElementById("descPanel");

const desc_panel = document.getElementById('desc-panel')
desc_panel.style.display = "none";   // 非表示
// desc_panel.style.display = "block";  // 表示

window.addEventListener('pointerdown', (e) => {
  
  handlePointer(e, "DOWN");

  // 2分割
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const label = el?.closest('.item-label');

  if (label) {
    // 文字の上にいる → 表示
    desc_panel.style.display = 'block';
    desc_panel.textContent = label.textContent; // とか概要文に差し替え

  } else {
    // 文字から外れた → 非表示
    desc_panel.style.display = 'none';
  }
});
      
window.addEventListener('mousemove', (e) => {
  handlePointer(e, "MOVE");
    // 2分割
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const label = el?.closest('.item-label');
  
    if (label) {
      // 文字の上にいる → 表示
      desc_panel.style.display = 'block';
      desc_panel.textContent = label.textContent; // とか概要文に差し替え
    }
});      

const canvas1 = document.getElementById('three-section');
let BeforeSection = undefined;

function handlePointer(e, source) {
  const el = document.elementFromPoint(e.clientX, e.clientY);

  // ① キャンバス判定
  const OnSection = el?.closest("section")?.id || "SectionOut";
  if (BeforeSection != OnSection){
    // console.log('外' + BeforeSection + ' : ' + '内' + OnSection)
  
    if (BeforeSection === 'three-section' && User_Device === 'pc'){
      toggleBtn.textContent = `🔴描画停止中.`;
      VewStop();
    } else if (BeforeSection === 'shop'){
      desc_panel.style.display = 'none';
    }
  
    if (OnSection === 'three-section' && User_Device === 'pc'){
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

addTapEvent(phoneBtn, () => selectDevice("phone"));
addTapEvent(pcBtn,   () => selectDevice("pc"));

// ２分割=====================================================

// items.forEach(item => {
//   item.addEventListener("click", () => {
//     const text = item.dataset.desc;
//     descPanel.textContent = text;
//   });
// });
// 画面中央にある section を判定して、class を付け替える

let LinkSection = undefined
let ActiveLink = false
let InLinkSection = false

function detectCenterSection() {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // 画面中央にある要素を取得
  const el = document.elementFromPoint(centerX, centerY);
  const currentSection = el?.closest("section[id]"); // id を持つ section だけ対象

  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');

  let activeId = currentSection ? currentSection.id : null;

  // console.log(currentSection, activeId)

  // section 側の active / inactive
  if (ActiveLink){

    if (!InLinkSection && activeId === LinkSection){
      InLinkSection = true

      sections.forEach(sec => {
        if (sec.id === activeId) {
          sec.classList.add("active");
          sec.classList.remove("inactive");
          sec.classList.remove("sub-inactive");
        } else {
          sec.classList.add("inactive");
          sec.classList.remove("active");
          sec.classList.remove("sub-inactive");
          if (sec.id === 'shop'){
            desc_panel.style.display = 'none';
          }
        }
      });

    } else if (InLinkSection && activeId != LinkSection){
      sections.forEach(sec => {
        sec.classList.add("active");
        sec.classList.remove("inactive");
      })
      ActiveLink = false

    } else {
      sections.forEach(sec => {
        if (sec.id === activeId) {
          sec.classList.add("active");
          sec.classList.remove("inactive");
        } else {
          sec.classList.add("inactive");
          sec.classList.remove("active");
        }
      });
    }
  } else {
    sections.forEach(sec => {
      if (sec.id === activeId) {
        sec.classList.add("active");
        sec.classList.remove("sub-inactive");
      } else {
        sec.classList.add("sub-inactive");
        sec.classList.remove("active");
        if (sec.id === 'shop'){
          desc_panel.style.display = 'none';
        }
      }
    });
  }
  // ナビリンク側の active 切り替え
  navLinks.forEach(link => {
    const targetId = link.getAttribute('href').slice(1); // "#news" → "news"
    if (targetId === activeId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// スクロールやリサイズのたびに判定
window.addEventListener("scroll", detectCenterSection);
window.addEventListener("resize", detectCenterSection);

// 初期表示時にも一回判定
window.addEventListener("DOMContentLoaded", detectCenterSection);

document.querySelectorAll('.nav a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    ActiveLink = true;
    const id = link.getAttribute('href');
    LinkSection = id.slice(1);
    InLinkSection = false;
    const target = document.querySelector(id);
    if (!target) return;
  
    const rect = target.getBoundingClientRect();
    const sectionTop = rect.top + window.scrollY;
    const sectionHeight = rect.height;
    const windowHeight = window.innerHeight;
  
    let targetPos;
  
    // セクションが画面より大きい場合：
    // → セクションの「先頭」が画面中央に来るようにする
    if (sectionHeight > windowHeight) {
      targetPos = sectionTop - 70;
    } else {
      // セクションが短い場合：
      // → セクションの「中央」が画面中央に来るようにする（元のロジック）
      targetPos = sectionTop - (windowHeight / 2) + (sectionHeight / 2);
    }
    window.scrollTo({
      top: targetPos,
      behavior: 'smooth'
    });
  });
});

// スクロールでナビの色を鮮やかに変える
window.addEventListener("scroll", () => {
  const scrollMax = document.body.scrollHeight - innerHeight;
  if (scrollMax <= 0) return;

  const ratio = scrollY / scrollMax; // 0〜1

  // 色相をループ
  const hue1 = ratio * 360;
  const hue2 = (ratio * 360 + 120) % 360;

  const grad1 = `hsl(${hue1}, 90%, 55%, 0.1)`;
  const grad2 = `hsl(${hue2}, 90%, 55%, 0.1)`;

  // CSS変数にセット
  const body = document.querySelector("body");
  body.style.setProperty("--grad1", `hsl(${hue1}, 90%, 55%, 0.08)`);
  body.style.setProperty("--grad2", `hsl(${hue2}, 90%, 55%, 0.08)`);

  const banner = document.querySelector(".sticky-banner");
  banner.style.setProperty("--grad1", `hsl(${hue1}, 90%, 55%, 0.2)`);
  banner.style.setProperty("--grad2", `hsl(${hue2}, 90%, 55%, 0.2)`);
});
