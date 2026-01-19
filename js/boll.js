// boll.js
// ボール遊びコード

// ====== Imports ======
import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

// ====== Three.js 基本セットアップ ======

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


function enterFullscreen() {
  section.classList.remove('banner');
  section.classList.add('fullscreen');

  // スクロールさせたくなければ封じる
  document.body.style.overflow = 'hidden';

  expandBtn.hidden = false;
  expandBtn.textContent = "拡小";
  shrinkBtn.hidden = true;

  ctrlX = canvas.clientWidth*0.1
  ctrlY = canvas.clientHeight*0.8
  ctrl_ui.style.left = ctrlX + "px";
  ctrl_ui.style.top  = ctrlY + "px";

  updateSize(); // キャンバスサイズとカメラを再計算
}

function exitFullscreen() {
  section.classList.remove('fullscreen');
  section.classList.add('banner');

  document.body.style.overflow = '';

  expandBtn.hidden = false;
  expandBtn.textContent = "拡大";
  shrinkBtn.hidden = true;

  ctrlX = canvas.clientWidth*0.1
  ctrlY = canvas.clientHeight*0.8
  ctrl_ui.style.left = ctrlX + 'px';
  ctrl_ui.style.top = ctrlY + 'px';

  updateSize();
}

expandBtn.addEventListener('click', () => {
  if (section.classList.contains('fullscreen')) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
});
shrinkBtn.addEventListener('click', exitFullscreen);

// タッチ操作用（必要なら）
expandBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (section.classList.contains('fullscreen')) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
}, { passive: false });

shrinkBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  exitFullscreen();
}, { passive: false });


scene.background = new THREE.Color(0x0b1020);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
camera.position.set(8, 6, 12);

// ====== 環境マップ ======
let envMap;
let envMapNight;

const textur_loader = new THREE.TextureLoader();
textur_loader.load('textures/skyy.jpg', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  scene.background = texture;
  scene.environment = texture;
  envMap = texture;
});

textur_loader.load('textures/moonless_golf.jpg', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  envMapNight = texture;
});


// ====== ライト ======
// scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(6, 12, 8);
dir.castShadow = true;
dir.shadow.mapSize.set(200, 200);
dir.shadow.bias = -0.0005;
dir.shadow.normalBias = 0.02;

scene.add(dir);


// ====== マテリアル・地面・グリッド・ボール見た目 ======
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.9, metalness: 0.0 });
const ballMat   = new THREE.MeshStandardMaterial({ color: 0xffcc55, roughness: 0.4, metalness: 0.1 });

const groundMesh = new THREE.Mesh(
  new THREE.BoxGeometry(100, 2, 100),
  groundMat,
);
groundMesh.receiveShadow = true;
groundMesh.position.y = -1;
scene.add(groundMesh);

const grid = new THREE.GridHelper(100, 100, 0x5577aa, 0x224466);
grid.position.y = -0.99;
scene.add(grid);

const radius = 0.3;
const ballMesh = new THREE.Mesh(
  new THREE.SphereGeometry(radius, 32, 16),
  ballMat
);
ballMesh.castShadow = true;
scene.add(ballMesh);

// ====== Rapier 物理セットアップ ======
await RAPIER.init();
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

const loader = new GLTFLoader();
const gltf = await loader.loadAsync('glb/dai.glb');
const root = gltf.scene;

root.traverse((obj) => {
  if (obj.isMesh) {
    obj.castShadow = true;
    obj.receiveShadow = true;
  }
});

scene.add(root);
root.updateMatrixWorld(true);

// Rapier の静的トライメッシュをメッシュごとに作る
root.traverse((child) => {
  if (!child.isMesh) return;
  const geom = child.geometry;
  if (!geom || !geom.attributes?.position) return;

  const pos = geom.attributes.position;
  const vertexCount = pos.count;

  const vertices = new Float32Array(vertexCount * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < vertexCount; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
    vertices[i * 3 + 0] = v.x;
    vertices[i * 3 + 1] = v.y;
    vertices[i * 3 + 2] = v.z;
  }

  let indices;
  if (geom.index) {
    const src = geom.index.array;
    indices = (src.BYTES_PER_ELEMENT === 4) ? src : new Uint32Array(src);
  } else {
    const triCount = Math.floor(vertexCount / 3);
    indices = new Uint32Array(triCount * 3);
    for (let i = 0; i < triCount * 3; i++) indices[i] = i;
  }

  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const collider = RAPIER.ColliderDesc.trimesh(vertices, indices);
  world.createCollider(collider, body);
});

world.integrationParameters.dt = 1 / 60;

// 地面（固定ボディ）
const groundBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0)
);

world.createCollider(
  RAPIER.ColliderDesc.cuboid(10, 1, 10).setFriction(0.8).setRestitution(0.0),
  groundBody
);

const groundCol = RAPIER.ColliderDesc.cuboid(50, 1, 50)
  .setFriction(0.9)
  .setRestitution(0.1);
world.createCollider(groundCol, groundBody);

// ボール（動的ボディ）
const ballBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 3, 0)
);
ballBody.enableCcd(true);

const ballCol = RAPIER.ColliderDesc.ball(radius)
  .setFriction(0.6)
  .setRestitution(0.55)
  .setDensity(2000);
world.createCollider(ballCol, ballBody);

// ====== 入力：投げる／リセット ======
function throwForward(power = 8, up = 4) {
  const dirVec = new THREE.Vector3();
  camera.getWorldDirection(dirVec);
  dirVec.normalize();

  const originPos = camera.position.clone().add(dirVec.clone().multiplyScalar(2));

  ballBody.setTranslation({ x: originPos.x, y: originPos.y, z: originPos.z }, true);

  const velocity = {
    x: dirVec.x * power,
    y: dirVec.y * power + up,
    z: dirVec.z * power
  };
  ballBody.setLinvel(velocity, true);
  ballBody.setAngvel({ x: 3, y: 0.5, z: 0 }, true);
}

function resetBall() {
  ballBody.setTranslation({ x: 0, y: 5, z: 0 }, true);
  ballBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  ballBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

  if (ballBody.resetForces)  ballBody.resetForces(true);
  if (ballBody.resetTorques) ballBody.resetTorques(true);
}

// ===== 視点（元コード踏襲） =====
const ctrl_ui = document.getElementById("controller");
let lastPosition1 = { x: 0, y: 0 };

const ctrlX = 160;
const ctrlY = canvas.height - 60 - 80;
let camera_num = 1;
let ctrl_num = 0;
let ctrl_id = null;

let dragging = false;

function search_ctrl_num(e) {
  const touches = e.touches;
  for (let i = 0; i < touches.length; i++) {
    if (40 > Math.sqrt((ctrlX - touches[i].clientX) ** 2 + (ctrlY - touches[i].clientY) ** 2)) {
      if (ctrl_id === null) {
        ctrl_id = e.changedTouches[0].identifier;
        ctrl_num = i;
        camera_num = (ctrl_num + 1) % 2;
      }
    }
  }
}

// マウス座標管理
const mouse = new THREE.Vector2();
let origin = [0, 0];
let origin_reach = 0;

// マウス移動を -1〜+1 に正規化
function handleMouseMove(x, y) {
  const element = canvas;
  const clientX = x - element.offsetLeft;
  const clientY = y - element.offsetTop;
  const w = element.offsetWidth;
  const h = element.offsetHeight;
  mouse.x = (clientX / w) * 2 - 1;
  mouse.y = -(clientY / h) * 2 + 1;
}

// デバッグ用（元コード残し）
function upsertLine(scene, name, start, end, options = {}) {
  const { color = 0xff0000, linewidth = 1 } = options;

  const old = scene.getObjectByName(name);
  if (old) {
    old.geometry.dispose();
    old.material.dispose();
    scene.remove(old);
  }

  const s = start.isVector3 ? start : new THREE.Vector3(start.x, start.y, start.z);
  const e = end.isVector3 ? end : new THREE.Vector3(end.x, end.y, end.z);

  const geometry = new THREE.BufferGeometry().setFromPoints([s, e]);
  const material = new THREE.LineBasicMaterial({ color, linewidth });

  const line = new THREE.Line(geometry, material);
  line.name = name;

  scene.add(line);
  return line;
}

// ====== キーボード入力（VewStart/VewStop対応にするため関数化） ======
let keys = {}; // const だと reset しにくいので let に変更

function onKeyDownMove(e) {
  keys[e.key.toLowerCase()] = true;

  // 必要ならスクロール抑制（Arrow/Space等）
  // e.preventDefault();
}

function onKeyUpMove(e) {
  keys[e.key.toLowerCase()] = false;
}

function onKeyDownThrow(e) {
  if (e.code === 'Space') throwForward(8, 4);
  if (e.code === 'KeyR') resetBall();
}

function onClickThrow() {
  throwForward(12, 5);
}

// ====== リサイズ（必要なら常時でもOK。ここでは開始/停止で付け外し） ======
function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

// ====== 視点操作イベント（無名関数 → 関数化） ======
function onMouseDown(e) {
  handleMouseMove(e.clientX, e.clientY);

  dragging = true;
  origin = [mouse.x, mouse.y];
  origin_reach = 0;

  ctrl_ui.style.left = e.clientX + 'px';
  ctrl_ui.style.top = e.clientY + 'px';
}

function onTouchStart(e) {
  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);

  search_ctrl_num(e);
  if (e.changedTouches[0].identifier !== ctrl_id && e.touches.length <= 2) {
    lastPosition1 = {
      x: e.touches[e.touches.length - 1].clientX,
      y: e.touches[e.touches.length - 1].clientY
    };
  }

  dragging = true;
  origin = [mouse.x, mouse.y];
  origin_reach = 0;

  ctrl_ui.style.left = touch.clientX + 'px';
  ctrl_ui.style.top = touch.clientY + 'px';
}

let cameraAngleY = 180 * Math.PI / 180;  // 水平回転
let cameraAngleX = Math.PI / 180;        // 垂直回転
let cameraAngleZ = 0;

function onMouseMove(e) {
  handleMouseMove(e.clientX, e.clientY);

  const diff_points = [mouse.x - origin[0], mouse.y - origin[1]];
  const radiusA = Math.atan2(diff_points[0], diff_points[1]);
  const reach = Math.sqrt(diff_points[0] ** 2 + diff_points[1] ** 2);

  const beside_incline = Math.sin(radiusA) * reach;
  const vertical_incline = Math.cos(radiusA) * reach;

  cameraAngleZ = Math.max(Math.min(beside_incline, 30 * Math.PI / 180), -30 * Math.PI / 180);
  cameraAngleX = Math.min(vertical_incline - 15 * Math.PI / 180, 0);

  camera.position.x = 0;
  camera.position.z = Math.sin(Math.min(vertical_incline, 0.3) * (75 * Math.PI / 180) + 75 * Math.PI / 180) * 15 + 5;
  camera.position.y = Math.cos(Math.min(vertical_incline, 0.3) * (75 * Math.PI / 180) + 75 * Math.PI / 180) * 15 + 5;

  const pulus = 0.8;
  const route_X = (beside_incline * pulus) + Math.PI;
  const route_Z = (vertical_incline * pulus) + Math.PI;

  const g = 9.81;
  world.gravity = {
    x: Math.sin(route_X) * -g,
    y: (Math.cos(route_X) * g + Math.cos(route_Z) * g) / 2,
    z: Math.sin(route_Z) * g
  };
}

function onTouchMove(e) {
  // 元コードは preventDefault していないが、必要なら解除
  // e.preventDefault();

  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);

  const diff_points = [mouse.x - origin[0], mouse.y - origin[1]];
  const radiusA = Math.atan2(diff_points[0], diff_points[1]);
  const reach = Math.sqrt(diff_points[0] ** 2 + diff_points[1] ** 2);

  const beside_incline = Math.sin(radiusA) * reach;
  const vertical_incline = Math.cos(radiusA) * reach;

  cameraAngleZ = Math.max(Math.min(beside_incline, 30 * Math.PI / 180), -30 * Math.PI / 180);
  cameraAngleX = Math.min(vertical_incline - 15 * Math.PI / 180, 0);

  camera.position.x = 0;
  camera.position.z = Math.sin(Math.min(vertical_incline, 0.3) * (75 * Math.PI / 180) + 75 * Math.PI / 180) * 15 + 5;
  camera.position.y = Math.cos(Math.min(vertical_incline, 0.3) * (75 * Math.PI / 180) + 75 * Math.PI / 180) * 15 + 5;

  const pulus = 0.8;
  const route_X = (beside_incline * pulus) + Math.PI;
  const route_Z = (vertical_incline * pulus) + Math.PI;

  const g = 9.81;
  world.gravity = {
    x: Math.sin(route_X) * -g,
    y: (Math.cos(route_X) * g + Math.cos(route_Z) * g) / 2,
    z: Math.sin(route_Z) * g
  };
}

let moveVectorX = 0;
let moveVectorZ = 0;

function onTouchEnd(e) {
  dragging = false;

  // 視点（元コード踏襲）
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
      lastPosition1 = {
        x: e.touches[e.touches.length - 1].clientX,
        y: e.touches[e.touches.length - 1].clientY
      };
    }
  }
}

function onMouseUp() {
  // 必要なら dragging=false にしてもOK（元コードはコメントアウト）
  // dragging = false;
}

// ====== enable / disable（ここが VewStart / VewStop の核） ======
function enableViewControl() {
  // 視点
  window.addEventListener('mousedown', onMouseDown, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: false });

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('touchmove', onTouchMove, { passive: false });

  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('touchend', onTouchEnd);

  // 投げる/リセット
  window.addEventListener('keydown', onKeyDownThrow);
  window.addEventListener('click', onClickThrow);

  // 移動キー（必要なら）
  document.addEventListener('keydown', onKeyDownMove);
  document.addEventListener('keyup', onKeyUpMove);

  // リサイズ
  window.addEventListener('resize', onResize);
}

function disableViewControl() {
  window.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('touchstart', onTouchStart);

  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('touchmove', onTouchMove);

  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('touchend', onTouchEnd);

  window.removeEventListener('keydown', onKeyDownThrow);
  window.removeEventListener('click', onClickThrow);

  document.removeEventListener('keydown', onKeyDownMove);
  document.removeEventListener('keyup', onKeyUpMove);

  window.removeEventListener('resize', onResize);
}

// ====== カメラ・移動系（元コードの値） ======
let baseSpeed = 0.1;
const rotateSpeed = 0.03;
const pitchLimit = Math.PI / 2 - 0.1;

camera.position.y += 1;
camera.position.z = 10;

// ====== アニメーションループ（停止可能にする） ======
let run_STOP = true;

function animate() {
  if (run_STOP) return;

  requestAnimationFrame(animate);

  // 物理（サブステップ）
  for (let i = 0; i < 2; i++) world.step();

  const t = ballBody.translation();
  const r = ballBody.rotation();
  ballMesh.position.set(t.x, t.y, t.z);
  ballMesh.quaternion.set(r.x, r.y, r.z, r.w);

  cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));
  cameraAngleX = Math.min(pitchLimit, Math.max(-pitchLimit, cameraAngleX));

  // カメラ注視点更新
  const direction = new THREE.Vector3(
    Math.sin(cameraAngleY) * Math.cos(cameraAngleX),
    Math.sin(cameraAngleX),
    Math.cos(cameraAngleY) * Math.cos(cameraAngleX)
  );

  camera.lookAt(new THREE.Vector3().addVectors(camera.position, direction));

  camera.rotation.z = cameraAngleZ;
  camera.rotation.x = cameraAngleX;

  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(true);

  renderer.render(scene, camera);

  updateSize()
}

// ====== 公開API：VewStart / VewStop ======
export async function ball_VewStart(one = false) {
  await new Promise(resolve => setTimeout(resolve, 0));

  // 二重起動防止
  if (!run_STOP) return;

  run_STOP = false;

  // 状態リセット（必要に応じて）
//   keys = {};
//   if (isNight) {
//     toggleBtn.textContent = "☀️ 昼にする";
//   } else {
//     toggleBtn.textContent = "🌙 夜にする";
//   }

  enableViewControl();
  onResize();      // 初回サイズ合わせ
 
  if (one){
    // toggleBtn.innerHTML = "🔴描画停止中...<br>🔴カーソルまたは指を描画領域へ入れると描画されます。";
    renderer.render(scene, camera);
    ball_VewStop();
  } else {
    updateSize();
    renderer.render(scene, camera);
    animate();
  }
}

export function ball_VewStop() {
  run_STOP = true;
  disableViewControl();
}

// ※ 以前は即 animate() していたが、VewStart を呼ぶ方式に変更したのでここでは呼ばない
// animate();
