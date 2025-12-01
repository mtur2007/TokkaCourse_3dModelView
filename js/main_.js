// main.js
"toggle-daynight"

// モバイルデバッグ用　ログ画面出力

// const ctrl = document.getElementById('controller');

// let logwindow = document.getElementById("logwindow");
// logwindow.hidden = true

// const log_hidden = document.getElementById("log");

// let text = ''

// function alert(txt){
//   text += txt+'\n'
//   logwindow.innerText = txt//keepLastNLines(text)
// }

// function keepLastNLines(text, maxLines = 20, options = {}) {
//   const {
//     treatEscapedNewline = false,
//     normalizeLineEndings = true,
//     joinWith = '\n'
//   } = options;

//   if (text == null) return '';

//   let s = String(text);

//   // オプション: "\\n" を実改行に変換
//   if (treatEscapedNewline) {
//     s = s.replace(/\\r\\n/g, '\r\n').replace(/\\r/g, '\r').replace(/\\n/g, '\n');
//   }

//   // 改行をLFに正規化
//   if (normalizeLineEndings) {
//     s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
//          .replace(/\u2028/g, '\n').replace(/\u2029/g, '\n').replace(/\u0085/g, '\n');
//   }

//   const lines = s.split('\n'); // 空行も 1 行としてカウント
//   if (lines.length <= maxLines) return lines.join(joinWith);

//   // 末尾 maxLines を残す（先頭の余分を削除）
//   const kept = lines.slice(lines.length - maxLines);
//   return kept.join(joinWith);
// }

// log_hidden.addEventListener("touchstart", () => {
//   if (logwindow.hidden){
//     let txt = ''
//     const max_len = 10
//     for (let i = 0; i < group_targetObjects.length; i++){
//       const cdnt_0 = group_targetObjects[i][0].position
//       const cdnt_1 = group_targetObjects[i][1].position

//       txt += '['+ i + '] { x: '+String(cdnt_0.x).slice(0, max_len) +', y: ' +String(cdnt_0.y).slice(0, max_len)+', z: ' +String(cdnt_0.z).slice(0, max_len) + '},'
//       txt += '{ x: '+String(cdnt_1.x).slice(0, max_len) +', y: ' +String(cdnt_1.y).slice(0, max_len)+', z: ' +String(cdnt_1.z).slice(0, max_len) + '}\n'
//     }
//     alert(txt)
//   }
//   logwindow.hidden = !logwindow.hidden
// });

import * as THREE from 'three';
const scene = new THREE.Scene();

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

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
renderer.physicallyCorrectLights = true;

// PMREMGenerator を一つだけ作って使い回すのが良い
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let envMap = null
let envMapNight = null
const loader = new THREE.TextureLoader();
  loader.load('textures/sky.jpg', (texture) => {
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

// --- 昼夜切替 ---
let isNight = false;

const toggleBtn = document.getElementById("toggle-daynight");

toggleBtn.addEventListener("click", () => {
  isNight = !isNight;

  if (isNight) {
    // 🌙 夜モード
    scene.background = envMapNight;
    scene.environment = envMapNight;
    
    dirLight.visible = false;
    // ambient.visible = false;

    toggleBtn.textContent = "☀️ 昼にする";

  } else {
    // ☀️ 昼モード
    scene.background = envMap;
    scene.environment = envMap;

    dirLight.visible = true;
    // ambient.visible = true;

    toggleBtn.textContent = "🌙 夜にする";
  }
});

toggleBtn.addEventListener("touchstart", () => {
  isNight = !isNight;

  if (isNight) {
    // 🌙 夜モード
    scene.background = envMapNight;
    scene.environment = envMapNight;

    dirLight.visible = false;
    // ambient.visible = false;

    toggleBtn.textContent = "☀️ 昼にする";

  } else {
    // ☀️ 昼モード
    scene.background = envMap;
    scene.environment = envMap;

    dirLight.visible = true;
    // ambient.visible = true;

    toggleBtn.textContent = "🌙 夜にする";
  }
});

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);

document.body.appendChild(renderer.domElement);

let run_STOP = false
let quattro = 0
let run_num = 0

// --- リサイズ対応 ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

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

let polePlacementMode = false;
let editObject = 'Standby'
// let trackEditSubMode = 'CREATE_NEW'; // 'CREATE_NEW' or 'MOVE_EXISTING'
let objectEditMode = 'Standby'; // 'CREATE_NEW' or 'MOVE_EXISTING'

// リサイズ変更
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

export function UIevent (uiID, toggle){
  if ( uiID === 'see' ){ if ( toggle === 'active' ){
    console.log( 'see _active' )
    OperationMode = 0
    search_object = false
    choice_object = false
    dragging = false
    setMeshListOpacity(targetObjects, 0.0);

  } else {
    console.log( 'see _inactive' )
  }} else if ( uiID === 'edit' ){ if ( toggle === 'active' ){
    console.log( 'edit _active' )
    OperationMode = 1
  } else {
    console.log( 'edit _inactive' )
  }} else if ( uiID === 'rail' ){ if ( toggle === 'active' ){
    console.log( 'rail _active' +'_'+ search_object)
    move_direction_y = false
    setMeshListOpacity(targetObjects, 1);
    editObject = 'RAIL'
 
  } else {
    console.log( 'rail _inactive' )
    setMeshListOpacity(targetObjects, 0);
    search_object = false
    move_direction_y = false
    editObject = 'Standby'

  }} else if ( uiID === 'new' ){ if ( toggle === 'active' ){
    console.log( 'new _active' )
    objectEditMode = 'CREATE_NEW'
    search_object = false

  } else {
    console.log( 'new _inactive' )

  }} else if ( uiID === 'move' ){ if ( toggle === 'active' ){
    console.log( 'move _active' )
    objectEditMode = 'MOVE_EXISTING'

    search_object = true
    search_point();

  } else {
    console.log( 'move _inactive' )
    search_object = false
    move_direction_y = false

    objectEditMode = 'Standby'

  }} else if ( uiID === 'x_z' ){ if ( toggle === 'active' ){
    console.log( 'x_z _active' )
    move_direction_y = false
  } else {
    console.log( 'x_z _inactive' )
    search_object = false
  }} else if ( uiID === 'y' ){ if ( toggle === 'active' ){
    console.log( 'y _active' )
    move_direction_y = true
  } else {
    console.log( 'y _inactive' )
    search_object = false
  }} else if ( uiID === 'poll' ){ if ( toggle === 'active' ){
  console.log( 'poll _active' )
  } else {
  console.log( 'poll _inactive' )
  }} else if ( uiID === 'new/2' ){ if ( toggle === 'active' ){
  console.log( 'new/2 _active' )
  } else {
  console.log( 'new/2 _inactive' )
  }} else if ( uiID === 'move/2' ){ if ( toggle === 'active' ){
  console.log( 'move/2 _active' )
  } else {
  console.log( 'move/2 _inactive' )
  }} else if ( uiID === 'x_z/2' ){ if ( toggle === 'active' ){
  console.log( 'x_z/2 _active' )
  } else {
  console.log( 'x_z/2 _inactive' )
  }} else if ( uiID === 'y/2' ){ if ( toggle === 'active' ){
  console.log( 'y/2 _active' )
  } else {
  console.log( 'y/2 _inactive' )
  }} else if ( uiID === 'creat' ){ if ( toggle === 'active' ){
  console.log( 'creat _active' )
    // const tilt = [
    // new THREE.Vector3(1, 10, -4),
    // new THREE.Vector3(0, 10, -2),
    // ]
    // const pos = new THREE.CatmullRomCurve3(tilt);
    // resetMeshListOpacity(targetObjects, tilt);
    // setMeshListOpacity(targetObjects, 1);

    // TSys.createTrack(pos,0,0xff0000)

    editObject = 'ORIGINAL'
    targetObjects = group_object
    setMeshListOpacity(targetObjects, 1);

  } else {
    console.log( 'creat _inactive' )
    // targetObjects = []
    setMeshListOpacity(targetObjects, 0);
    editObject = 'Standby'

  }} else if ( uiID === 'sphere' ){ if ( toggle === 'active' ){
  console.log( 'sphere _active' )
  } else {
  console.log( 'sphere _inactive' )
  }} else if ( uiID === 'cube' ){ if ( toggle === 'active' ){
    console.log( 'cube _active' )
    objectEditMode = 'CREATE_NEW'
    search_object = false
    targetObjects = []
    setMeshListOpacity(targetObjects, 1);

  } else {
    console.log( 'cube _inactive' )
    // if (group_EditNow != 'None'){
    //   console.log('bisible')
    //   group_targetObjects[group_EditNow][0].visible = false;
    //   group_targetObjects[group_EditNow][1].visible = false;
    // }

    console.log('false; '+targetObjects)
    setMeshListOpacity(targetObjects, 0);

  }} else if ( uiID === 'pick' ){ if ( toggle === 'active' ){
    console.log( 'pick _active' )
    objectEditMode = 'PICK'

    search_object = true

    targetObjects = group_object
    setMeshListOpacity(targetObjects, 1);
    search_point();

  } else {
    console.log( 'pick _inactive' )

    search_object = false
    move_direction_y = false

    objectEditMode = 'Standby'

  }} else if ( uiID === 'move/3' ){ if ( toggle === 'active' ){
    console.log( 'move/3 _active' )
    objectEditMode = 'MOVE_EXISTING'

    targetObjects = group_targetObjects[group_EditNow]
    setMeshListOpacity(targetObjects, 1);

    search_object = true
    search_point();

  } else {
    console.log( 'move/3 _inactive' )
    search_object = false
    move_direction_y = false
    setMeshListOpacity(targetObjects, 0);

    objectEditMode = 'Standby'

  }} else if ( uiID === 'x_z/3' ){ if ( toggle === 'active' ){
    console.log( 'x_z/3 _active' )
    move_direction_y = false
  } else {
    console.log( 'x_z/3 _inactive' )
;
  }} else if ( uiID === 'y/3' ){ if ( toggle === 'active' ){
    console.log( 'y/3 _active' )
    move_direction_y = true
    
  } else {
    console.log( 'y/3 _inactive' )
    search_object = false
  
  }} else if ( uiID === 'custom' ){ if ( toggle === 'active' ){
    console.log( 'custom _active' )
    move_direction_y = false
    setMeshListOpacity(targetObjects, 1);
    editObject = 'CUSTOM'

    } else {
    console.log( 'custom _inactive' )

  }} else if ( uiID === 'new/3' ){ if ( toggle === 'active' ){
    console.log( 'new/3 _active' )
    objectEditMode = 'CREATE_NEW'
    search_object = false

    } else {
    console.log( 'new/3 _inactive' )
    search_object = false
    move_direction_y = false

    objectEditMode = 'Standby'

  }} else if ( uiID === 'move/4' ){ if ( toggle === 'active' ){
    console.log( 'move/4 _active' )
    } else {
    console.log( 'move/4 _inactive' )
  }} else if ( uiID === 'x_z/4' ){ if ( toggle === 'active' ){
    console.log( 'x_z/4 _active' )
    } else {
    console.log( 'x_z/4 _inactive' )
  }} else if ( uiID === 'y/4' ){ if ( toggle === 'active' ){
    console.log( 'y/4 _active' )
    } else {
    console.log( 'y/4 _inactive' )
  }} else if ( uiID === 'construct' ){ if ( toggle === 'active' ){
    console.log( 'construct _active' )
    objectEditMode = 'CONSTRUCT'

    search_object = true
    search_point();
 
    } else {
    console.log( 'construct _inactive' )
    objectEditMode = 'Standby'
    search_object = false

  }}
}

// 視点操作
// カメラ操作 ----------------------------------------------------------------

const ctrl_ui = document.getElementById("controller")
let lastPosition1 = { x: 0, y: 0 };

const ctrlX = 160
const ctrlY = canvas.height - 60 - 80
let camera_num = 1
let ctrl_num = 0

let ctrl_id = null

function search_ctrl_num(e){
  const touches = e.touches
  for(let i = 0; i < touches.length; i++){
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

// ジョイコン or 視点 判定 : 物体移動開始
// window.addEventListener('mousedown', handleMouseDown);

window.addEventListener('touchstart', (e) => {

  // UI監視
  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);
  
  // 視点
  search_ctrl_num(e)
  if (e.changedTouches[0].identifier != ctrl_id && e.touches.length <= 2){
  lastPosition1 = { x: e.touches[e.touches.length-1].clientX, y: e.touches[e.touches.length-1].clientY }
  }

  // --- 編集モード
  if (OperationMode === 0){return}
  e.preventDefault();      // ← スクロールを止める
  if (objectEditMode === 'MOVE_EXISTING') { 
    dragging = null//'stand_by';
    onerun_search_point();
  }

}, { passive: false });


// 位置&視点 操作 : 物体移動追尾
document.addEventListener('mousemove', (e) => {
  
  // UI監視 編集モード
  handleMouseMove(e.clientX, e.clientY);
});

document.addEventListener('touchmove', (e) => {
  e.preventDefault();

  // UI監視
  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);

  // console.log('see'+ dragging)

  // 視点
  if (e.touches.length === 1) {
    if (ctrl_id === null){
      const dx = lastPosition1.x - e.touches[0].clientX;
      const dy = lastPosition1.y - e.touches[0].clientY;

      const angle2 = Math.atan2(dx,dy)
      const range = Math.sqrt(dx**2 + dy**2)

      cameraAngleY += Math.sin(angle2) * range * 0.005;
      cameraAngleX += Math.cos(angle2) * range * 0.005;
      cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));

      lastPosition1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      const dx = ctrlX - e.touches[0].clientX;
      const dy = ctrlY - e.touches[0].clientY;

      const angley = cameraAngleY + Math.atan2(dx,dy)
      const range = Math.sqrt(dx**2 + dy**2)
      moveVectorX = Math.sin(angley) * range * 0.01
      moveVectorZ = Math.cos(angley) * range * 0.01

      const ctrl_angle = Math.atan2(dx,dy)
      ctrl_ui.style.left = ctrlX - Math.sin(ctrl_angle) * Math.min(40, range) + 'px';
      ctrl_ui.style.top = ctrlY - Math.cos(ctrl_angle) * Math.min(40, range) + 'px';

    }
  } else if (e.touches.length >= 2) {

    if (ctrl_id===null){return}
    // if (e.changedTouches[1].identifier === ctrl_id){alert('ctrl1')}

    const cdx = lastPosition1.x - e.touches[camera_num].clientX;
    const cdy = lastPosition1.y - e.touches[camera_num].clientY;
    const angle2 = Math.atan2(cdx,cdy)
    const crange = Math.sqrt(cdx**2 + cdy**2)

    cameraAngleY += Math.sin(angle2) * crange * 0.005;
    cameraAngleX += Math.cos(angle2) * crange * 0.005;
    cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));

    lastPosition1 = { x: e.touches[camera_num].clientX, y: e.touches[camera_num].clientY };
  
    const dx = ctrlX - e.touches[ctrl_num].clientX;
    const dy = ctrlY - e.touches[ctrl_num].clientY;

    const angley = cameraAngleY + Math.atan2(dx,dy)
    const range = Math.sqrt(dx**2 + dy**2)
    moveVectorX = Math.sin(angley) * range * 0.01
    moveVectorZ = Math.cos(angley) * range * 0.01

    const ctrl_angle = Math.atan2(dx,dy)
    ctrl_ui.style.left = ctrlX - Math.sin(ctrl_angle) * Math.min(40, range) + 'px';
    ctrl_ui.style.top = ctrlY - Math.cos(ctrl_angle) * Math.min(40, range) + 'px';

  }

}, { passive: false });


// // 物体移動完了
// document.addEventListener('mouseup', () => {
//   handleMouseUp();
// });

document.addEventListener('touchend',(e)=>{
  // 視点
  if (ctrl_id === e.changedTouches[0].identifier){
    ctrl_id = null
    ctrl_num = null
    moveVectorX = 0;
    moveVectorZ = 0; 
    ctrl_ui.style.left = ctrlX + 'px';
    ctrl_ui.style.top = ctrlY + 'px';
  } else {
    ctrl_num = 0
    camera_num = 1

    if (e.touches.length > 0){
      // 2本以上指が置かれいた場合に備えて、最後のベクトルを格納
      lastPosition1 = { x: e.touches[e.touches.length-1].clientX, y: e.touches[e.touches.length-1].clientY }
    }
  }
}
);

// アナロク操作（デバッグ用）
// カメラの位置（視点の位置）

// キーボード操作（鑑賞用）
// ========== 設定値 ========== //
let baseSpeed = 0.1;
const rotateSpeed = 0.03;
const pitchLimit = Math.PI / 2 - 0.1;

// ========== 入力管理 ========== //
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// ========== カメラ制御変数 ========== //
let cameraAngleY = 180 * Math.PI / 180;  // 水平回転
let cameraAngleX = Math.PI / 180;  // 垂直回転
let moveVectorX = 0
let moveVectorZ = 0

camera.position.y += 1
camera.position.z = 10//-13
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

let key = '0'
document.addEventListener('keydown', (e) => {
  key = e.key.toLowerCase();
});

function animate() {
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

  // メインカメラ：画面全体
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
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
}

animate();
