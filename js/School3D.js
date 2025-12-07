// School3D.js : 3D空間を 構築/移動 する為のファイル

import * as THREE from 'three';
const scene = new THREE.Scene();

// 既存の canvas を取得
const canvas = document.getElementById('three-canvas');

// その canvas を three.js に渡す
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});

function updateSize() {
  const width  = canvas.clientWidth;
  const height = canvas.clientHeight;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// ← 高解像度ディスプレイに対応
renderer.setPixelRatio(1.5);

// ===== 拡大/拡小 =====
const section = document.getElementById('three-section');

const expandBtn = document.getElementById('expand-btn');
const shrinkBtn = document.getElementById('shrink-btn');

// 昼夜切り替え
const toggleBtn = document.getElementById("toggle-daynight");

const banner = document.getElementById("banner");

function enterFullscreen() {

  banner.style.display = "none"

  section.classList.remove('banner');
  section.classList.add('fullscreen');

  // スクロールさせたくなければ封じる
  document.body.style.overflow = 'hidden';

  expandBtn.hidden = true;
  shrinkBtn.hidden = false;

  ctrlX = canvas.clientWidth*0.1
  ctrlY = canvas.clientHeight*0.8
  ctrl_ui.style.left = ctrlX + "px";
  ctrl_ui.style.top  = ctrlY + "px";

  updateSize(); // キャンバスサイズとカメラを再計算
}

function exitFullscreen() {

  banner.style.display = "block"

  section.classList.remove('fullscreen');
  section.classList.add('banner');

  document.body.style.overflow = '';

  expandBtn.hidden = false;
  shrinkBtn.hidden = true;

  ctrlX = canvas.clientWidth*0.1
  ctrlY = canvas.clientHeight*0.8
  ctrl_ui.style.left = ctrlX + 'px';
  ctrl_ui.style.top = ctrlY + 'px';

  updateSize();
}

expandBtn.addEventListener('click', enterFullscreen);
shrinkBtn.addEventListener('click', exitFullscreen);

// タッチ操作用（必要なら）
expandBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  enterFullscreen();
}, { passive: false });

shrinkBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  exitFullscreen();
}, { passive: false });

// // ← CSSと合わせるならこれでOK
// renderer.setSize(window.innerWidth, window.innerHeight);

import { WorldCreat } from './world_creat.js';
await WorldCreat(scene);

const dirLight = scene.getObjectByName('dirLight');

// ----------------- シャドウを有効化（renderer を作った直後あたりに入れる） -----------------
renderer.shadowMap.enabled = true;                         // シャドウを有効化
renderer.shadowMap.type = THREE.PCFSoftShadowMap;         // ソフトシャドウ（見た目良し・負荷中）
renderer.outputColorSpace = THREE.SRGBColorSpace;         // 既存の行があるなら残す

// --- マップの半自動作成(路線設定) ---

// 座標感覚の可視化
// Map_pin(10,10,20,0.2,0xff0000)
// Map_pin(10,10,10,0.5,0xff0000)

// Map_pin(-10,10,20,0.2,0xff0000)
// Map_pin(-10,10,10,0.5,0x0000ff)

// Map_pin(-10,-10,20,0.2,0x0000ff)
// Map_pin(-10,-10,10,0.5,0x0000ff)

// Map_pin(10,-10,20,0.2,0x0000ff)
// Map_pin(10,-10,10,0.5,0xff0000)

// 昼の環境マップ（初期）
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.physicallyCorrectLights = false;

// PMREMGenerator を一つだけ作って使い回すのが良い
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let envMap = null
let envMapNight = null
const loader = new THREE.TextureLoader();
  loader.load('textures/skyy.jpg', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    scene.environment = texture;
    envMap = texture;
  });

loader.load('textures/moonless_golf.jpg', (texture_night) => {
  texture_night.mapping = THREE.EquirectangularReflectionMapping;
  texture_night.colorSpace = THREE.SRGBColorSpace;
  // scene.background = texture_night;
  // scene.environment = texture_night;
  envMapNight = texture_night ;
});

// envMap = envMapNight

scene.background = envMapNight;
scene.environment = envMapNight;

scene.background = envMap;
scene.environment = envMap;

renderer.toneMappingExposure = 1;

console.log('WorldCreat')

// world_creat()

// --- ライト追加（初回のみ） ---
// const ambient = new THREE.AmbientLight(0xffffff, 0.6);
// scene.add(ambient);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// レイキャストを作成
const raycaster = new THREE.Raycaster();
let pause = false;

// すべてのボタンに hover 検出を付ける
const buttons = document.querySelectorAll("button");

buttons.forEach(btn => {
  btn.addEventListener("mouseenter", () => {
    pause = true; // 一時停止
  });

  btn.addEventListener("mouseleave", () => {
    pause = false; // 再開
  });
});

buttons.forEach(btn => {
  // 指がボタンに触れたとき（mouseenter 相当）
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault(); // ページスクロールを防止
    pause = true; // 一時停止
  }, { passive: false });

  // 指がボタンから離れたとき（mouseleave 相当）
  btn.addEventListener("touchend", () => {
    pause = false; // 再開
  });

  // タッチがキャンセルされたとき（例: 指が画面外にずれた）
  btn.addEventListener("touchcancel", () => {
    pause = false; // 再開
  });
});

// モード状態（例）
let OperationMode = 0;
let objectEditMode = 'Standby'; // 'CREATE_NEW' or 'MOVE_EXISTING'

// 視点操作
// カメラ操作 ----------------------------------------------------------------

const ctrl_ui = document.getElementById("controller")
let lastPosition1 = { x: 0, y: 0 };

let ctrlX = 160
// canvas.clientWidth / canvas.clientHeight
let ctrlY = canvas.clientHeight*0.9 // - 60 - 80
console.log(canvas.clientHeight)

ctrl_ui.style.left = ctrlX + 'px';
ctrl_ui.style.top = ctrlY + 'px';

let camera_num = 1
let ctrl_num = 0

let ctrl_id = null

async function search_ctrl_num(e){
  const touches = e.touches
  console.log(touches)
  for(let i = 0; i < touches.length; i++){
    console.log(ctrlX-touches[i].clientX,ctrlY-touches[i].clientY)
    if (40 > Math.sqrt((ctrlX-touches[i].clientX)**2 + (ctrlY-touches[i].clientY)**2)){
      if (ctrl_id === null){
        ctrl_id = e.changedTouches[0].identifier
        ctrl_num = i
        camera_num = (ctrl_num+1)%2
      }
    }
  }
}

// マウス座標管理用のベクトルを作成
const mouse = new THREE.Vector2();

// マウスを動かしたときのイベント
function handleMouseMove(x, y) {
  const element = canvas;
  // canvas要素上のXY座標
  const clientX = x - element.offsetLeft;
  const clientY = y - element.offsetTop;
  // canvas要素の幅・高さ
  const w = element.offsetWidth;
  const h = element.offsetHeight;
  // -1〜+1の範囲で現在のマウス座標を登録する
  mouse.x = ( clientX / w ) * 2 - 1;
  mouse.y = -( clientY / h ) * 2 + 1;
}

// ----------------------
// 1) touchstart ハンドラ
// ----------------------
const handleTouchStart = async (e) => {
  // UI監視
  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);
  
  // 視点
  await search_ctrl_num(e);
  console.log('run');
  if (e.changedTouches[0].identifier != ctrl_id && e.touches.length <= 2) {
    lastPosition1 = {
      x: e.touches[e.touches.length - 1].clientX,
      y: e.touches[e.touches.length - 1].clientY
    };
  }

  // --- 編集モード
  if (OperationMode === 0) { return; }

  e.preventDefault();      // ← スクロールを止める

  if (objectEditMode === 'MOVE_EXISTING') {
    dragging = null; // 'stand_by';
    onerun_search_point();
  }
};

// ----------------------
// 2) mousemove ハンドラ
// ----------------------
const handleDocumentMouseMove = (e) => {
  // UI監視 編集モード
  handleMouseMove(e.clientX, e.clientY);
};

// ----------------------
// 3) touchmove ハンドラ
// ----------------------
const handleTouchMove = (e) => {
  e.preventDefault();

  // UI監視
  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);

  // 視点
  if (e.touches.length === 1) {
    if (ctrl_id === null) {
      const dx = lastPosition1.x - e.touches[0].clientX;
      const dy = lastPosition1.y - e.touches[0].clientY;

      const angle2 = Math.atan2(dx, dy);
      const range = Math.sqrt(dx ** 2 + dy ** 2);

      cameraAngleY += Math.sin(angle2) * range * 0.005;
      cameraAngleX += Math.cos(angle2) * range * 0.005;
      cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));

      lastPosition1 = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else {
      const dx = ctrlX - e.touches[0].clientX;
      const dy = ctrlY - e.touches[0].clientY;

      const angley = cameraAngleY + Math.atan2(dx, dy);
      const range = Math.sqrt(dx ** 2 + dy ** 2);
      moveVectorX = Math.sin(angley) * range * 0.01;
      moveVectorZ = Math.cos(angley) * range * 0.01;

      const ctrl_angle = Math.atan2(dx, dy);
      ctrl_ui.style.left = ctrlX - Math.sin(ctrl_angle) * Math.min(40, range) + 'px';
      ctrl_ui.style.top = ctrlY - Math.cos(ctrl_angle) * Math.min(40, range) + 'px';
    }
  } else if (e.touches.length >= 2) {

    if (ctrl_id === null) { return; }

    const cdx = lastPosition1.x - e.touches[camera_num].clientX;
    const cdy = lastPosition1.y - e.touches[camera_num].clientY;
    const angle2 = Math.atan2(cdx, cdy);
    const crange = Math.sqrt(cdx ** 2 + cdy ** 2);

    cameraAngleY += Math.sin(angle2) * crange * 0.005;
    cameraAngleX += Math.cos(angle2) * crange * 0.005;
    cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));

    lastPosition1 = {
      x: e.touches[camera_num].clientX,
      y: e.touches[camera_num].clientY
    };

    const dx = ctrlX - e.touches[ctrl_num].clientX;
    const dy = ctrlY - e.touches[ctrl_num].clientY;

    const angley = cameraAngleY + Math.atan2(dx, dy);
    const range = Math.sqrt(dx ** 2 + dy ** 2);
    moveVectorX = Math.sin(angley) * range * 0.01;
    moveVectorZ = Math.cos(angley) * range * 0.01;

    const ctrl_angle = Math.atan2(dx, dy);
    ctrl_ui.style.left = ctrlX - Math.sin(ctrl_angle) * Math.min(40, range) + 'px';
    ctrl_ui.style.top = ctrlY - Math.cos(ctrl_angle) * Math.min(40, range) + 'px';
  }
};

// ----------------------
// 4) touchend ハンドラ
// ----------------------
const handleTouchEnd = (e) => {
  // 視点
  if (ctrl_id === e.changedTouches[0].identifier) {
    ctrl_id = null;
    ctrl_num = null;
    moveVectorX = 0;
    moveVectorZ = 0;
    ctrl_ui.style.left = ctrlX + 'px';
    ctrl_ui.style.top = ctrlY + 'px';
  } else {
    ctrl_num = 0;
    camera_num = 1;

    if (e.touches.length > 0) {
      // 2本以上指が置かれていた場合に備えて、最後のベクトルを格納
      lastPosition1 = {
        x: e.touches[e.touches.length - 1].clientX,
        y: e.touches[e.touches.length - 1].clientY
      };
    }
  }
};

// window.addEventListener('touchstart', handleTouchStart, { passive: false });
// document.addEventListener('mousemove', handleDocumentMouseMove);
// document.addEventListener('touchmove', handleTouchMove, { passive: false });
// document.addEventListener('touchend', handleTouchEnd);

// window.removeEventListener('touchstart', handleTouchStart, { passive: false });
// document.removeEventListener('mousemove', handleDocumentMouseMove);
// document.removeEventListener('touchmove', handleTouchMove, { passive: false });
// document.removeEventListener('touchend', handleTouchEnd);

// --- 昼夜切替 ---
let isNight = false;

async function toggleDayNight(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }

  toggleBtn.textContent = "変更中...";
  await new Promise(resolve => setTimeout(resolve, 0));

  isNight = !isNight;

  if (isNight) {
    // 🌙 夜モード
    scene.background = envMapNight;
    scene.environment = envMapNight;
    dirLight.color.set(0xffc27a);
    dirLight.intensity = 2.0;
    dirLight.position.set(-50, 20, -100);

    toggleBtn.textContent = "☀️ 昼にする";
  } else {
    // ☀️ 昼モード
    scene.background = envMap;
    scene.environment = envMap;
    dirLight.color.set(0xffeeee);    
    dirLight.intensity = 1.0;
    dirLight.position.set(200, 200, 200);

    toggleBtn.textContent = "🌙 夜にする";
  }
}

// マウスでもタッチでも同じ関数を呼ぶ
toggleBtn.addEventListener("click", toggleDayNight);
toggleBtn.addEventListener("touchstart", toggleDayNight, { passive: false });


// アナロク操作（デバッグ用）
// カメラの位置（視点の位置）

// キーボード操作（鑑賞用）
// ========== 設定値 ========== //
let baseSpeed = 0.1;
const rotateSpeed = 0.03;
const pitchLimit = Math.PI / 2 - 0.1;

// ========== 入力管理 ========== //
// const keys = {};
// document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
// document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
// キー状態の管理オブジェクト

let keys = {};

// --- スクロールを止めたいキー一覧 ---
const scrollBlockKeys = [
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  " ",
  "space",       // どちらも念のため
  "pageup",
  "pagedown",
  "home",
  "end"
];

// --- イベントリスナー関数（参照を保持する必要あり） ---
function keyDownHandler(e) {
  const key = e.key.toLowerCase();
  keys[key] = true;

  // スクロール防止
  if (scrollBlockKeys.includes(key)) {
    e.preventDefault();
  }
}

function keyUpHandler(e) {
  const key = e.key.toLowerCase();
  keys[key] = false;

  // keyup では preventDefault する必要はないが、一応同じ条件で扱える
  if (scrollBlockKeys.includes(key)) {
    e.preventDefault();
  }
}

// --- 有効化 ---
function enableKeyControl() {
  document.addEventListener("keydown", keyDownHandler, { passive: false });
  document.addEventListener("keyup", keyUpHandler, { passive: false });
}

// --- 無効化 ---
function disableKeyControl() {
  document.removeEventListener("keydown", keyDownHandler);
  document.removeEventListener("keyup", keyUpHandler);
}

// ========== カメラ制御変数 ========== //
let cameraAngleY = 0 * Math.PI / 180;  // 水平回転
let cameraAngleX = Math.PI / 180;  // 垂直回転
let moveVectorX = 0
let moveVectorZ = 0

camera.position.y += 2.5
camera.position.z = -8//-13
// ========== ボタン UI ========== //
// 状態フラグ
let speedUp = false;
let moveUp = false;
let moveDown = false;

document.getElementById('speed-up').addEventListener('touchstart', () => speedUp = true);
document.getElementById('speed-up').addEventListener('mousedown', () => speedUp = true);

document.getElementById('speed-down').style.display = 'none';
document.getElementById('speed-down').addEventListener('touchstart', () => speedUp = true);
document.getElementById('speed-down').addEventListener('mousedown', () => speedUp = true);

document.getElementById('btn-up').addEventListener('touchstart', () => moveUp = true);
document.getElementById('btn-up').addEventListener('touchend', () => moveUp = false);
document.getElementById('btn-down').addEventListener('touchstart', () => moveDown = true);
document.getElementById('btn-down').addEventListener('touchend', () => moveDown = false);

document.getElementById('btn-up').addEventListener('mousedown', () => moveUp = true);
document.getElementById('btn-up').addEventListener('mouseup', () => moveUp = false);
document.getElementById('btn-down').addEventListener('mousedown', () => moveDown = true);
document.getElementById('btn-down').addEventListener('mouseup', () => moveDown = false);

// // 例：クリックで移動
// stage.addEventListener('click', (e) => {
//   // e.clientX/Y はビューポート座標（スクロール影響なし）
//   setControllerPos(e.clientX, e.clientY);
// });

// ========== アニメーションループ ========== //

exitFullscreen()

const blockKeys = [
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Space", "PageUp", "PageDown", "Home", "End"
];

let key = '0'
document.addEventListener('keydown', (e) => {
  
  // e.preventDefault();    // ← キーによるスクロール停止

  key = e.key.toLowerCase();

  // if (blockKeys.includes(key)) {
  //   console.log('out_key')
  //   e.preventDefault();    // ← キーによるスクロール停止
  // }

});

let run_STOP = false
function animate() {

  if (run_STOP){return}

  requestAnimationFrame(animate);

  // console.log(b6dm.rotation)

  const moveSpeed = baseSpeed;

  // キーボード移動処理
  const strafe = (keys['a'] ? 1 : 0) - (keys['d'] ? 1 : 0);
  const forward = (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
    
  // 数字キー押下で倍率設定
  if (key >= '1' && key <= '9') {
    baseSpeed = parseInt(key, 10) * (parseInt(key, 10) *0.05);
  }
  // 0キーで倍率リセット
  else if (key === '0') {
    baseSpeed = moveSpeed;
  }

  // 横移動
  camera.position.x += Math.sin(cameraAngleY + Math.PI / 2) * moveSpeed * strafe;
  camera.position.z += Math.cos(cameraAngleY + Math.PI / 2) * moveSpeed * strafe;

  // 前後移動
  camera.position.x += Math.sin(cameraAngleY) * moveSpeed * forward;
  camera.position.z += Math.cos(cameraAngleY) * moveSpeed * forward;

  // スティック入力（カメラ基準移動）
  camera.position.x += moveVectorX * moveSpeed;
  camera.position.z += moveVectorZ * moveSpeed;

  if (speedUp) {
    if (baseSpeed === 0.1){
      baseSpeed = 0.9
      document.getElementById('speed-up').style.display = 'none';
      document.getElementById('speed-down').style.display = 'block';
    } else {
      baseSpeed = 0.1
      document.getElementById('speed-up').style.display = 'block';
      document.getElementById('speed-down').style.display = 'none';
    }
    speedUp = false
  }

  // 上下移動（Q/Eキー）
  if (keys['q'] || moveUp) {
    camera.position.y += moveSpeed*0.5;
  }
  if (keys['e'] || moveDown) {
    camera.position.y -= moveSpeed*0.5;
  }
  
  // 回転（左右）
  if (keys['arrowleft'])  cameraAngleY += rotateSpeed;
  if (keys['arrowright']) cameraAngleY -= rotateSpeed;

  // 回転（上下）
  if (keys['arrowup'])    cameraAngleX += rotateSpeed;
  if (keys['arrowdown'])  cameraAngleX -= rotateSpeed;
  cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));

  // カメラ注視点の更新
  // rightStickVector.x → 左右方向（横回転に使う）
  // rightStickVector.y → 上下方向（縦回転に使う）

  // ピッチ制限（上下の角度が大きくなりすぎないように）
  cameraAngleX = Math.min(pitchLimit, Math.max(-pitchLimit, cameraAngleX));

  // カメラの注視点の更新（カメラ位置 + 方向ベクトル）
  const direction = new THREE.Vector3(
    Math.sin(cameraAngleY) * Math.cos(cameraAngleX),
    Math.sin(cameraAngleX),
    Math.cos(cameraAngleY) * Math.cos(cameraAngleX)
  );

  camera.lookAt(new THREE.Vector3().addVectors(camera.position, direction));

  // canvasサイズに合わせる
  const width  = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width, height);
  renderer.setScissorTest(true);

  renderer.render(scene, camera);

  // if (dragging === true){
  //   const pos = choice_object.position
  //   cameraSub.position.set(pos.x-Math.sin(cameraAngleY)*0.2,pos.y+5,pos.z-Math.cos(cameraAngleY)*0.2)

  //   cameraSub.lookAt(pos.x,pos.y,pos.z)
  //   // サブカメラ：画面右下に小さく表示
  //   const insetWidth = window.innerWidth / 4;  // 画面幅の1/4サイズ
  //   const insetHeight = window.innerHeight / 4; // 画面高の1/4サイズ
  //   const insetX = 110; // 右下から10pxマージン
  //   const insetY = window.innerHeight - insetHeight - 100; // 下から10pxマージン

  //   renderer.setViewport(insetX, insetY, insetWidth, insetHeight);
  //   renderer.setScissor(insetX, insetY, insetWidth, insetHeight);
  //   renderer.setScissorTest(true);
    
  //   if (!move_direction_y){
  //     GuideGrid_Center_x.position.copy(choice_object.position)
  //     GuideGrid_Center_x.visible = true
  //     GuideGrid_Center_z.position.copy(choice_object.position)
  //     GuideGrid_Center_z.visible = true
  //   }
  //   renderer.render(scene, cameraSub);
  //   if (!move_direction_y){
  //     GuideGrid_Center_x.visible = false
  //     GuideGrid_Center_z.visible = false
  //   }
  // }
  
  updateSize()

}

// animate();

export async function VewStart(){
  
  await new Promise(resolve => setTimeout(resolve, 0));

  run_STOP = false
  
  keys = {};

  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('mousemove', handleDocumentMouseMove);
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);

  enableKeyControl();  // ← キー入力とスクロール停止が有効になる

  if (isNight){toggleBtn.textContent = "☀️ 昼にする";}else{toggleBtn.textContent = "🌙 夜にする";}
  

  animate()

}

export function VewStop(){
  run_STOP = true
  
  window.removeEventListener('touchstart', handleTouchStart, { passive: false });
  document.removeEventListener('mousemove', handleDocumentMouseMove);
  document.removeEventListener('touchmove', handleTouchMove, { passive: false });
  document.removeEventListener('touchend', handleTouchEnd);

  // いつでも停止可能
  disableKeyControl();

}