// main.js（修正版：_lastPlayer / armPlayerMoveCheck のスコープ修正 + 追尾中speed2倍 + 音 + 二重起動削除）

import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();

// 既存の canvas を取得
const canvas = document.getElementById("three-canvas");

// その canvas を three.js に渡す
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});

// ← 高解像度ディスプレイに対応
renderer.setPixelRatio(1.5);

// カメラ
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// リサイズ
function updateSize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// 使い回しベクトル
const tmpTarget = new THREE.Vector3();

// 追いかけられ中の移動倍率（B追尾中に2倍）
let chaseSpeedMul = 1;

// 音再生の許可（ユーザー操作後 true）
let soundArmed = false;

// ============================================================
// Audio（グローバル参照：スコープ事故防止）
// ============================================================
let listener = null;
let audioLoader = null;
let boonSound = null;
let boonSoundReady = false;

// ============================================================
// 足音（プレイヤー速度に応じて鳴らす）
// ============================================================
// ※ footsteps1.mp3 ~ footsteps3.mp3 を用意してください（短い一歩音が理想）
let footSound = null;
let footSoundBuffers = [];
let footSoundReady = false;
let lastFootIndex = -1;

// 足音計測用
const footClock = new THREE.Clock();
const _footPrev = new THREE.Vector3();
const _footCur = new THREE.Vector3();
let _stepAcc = 0;

// 速度→足音チューニング（好みで調整）
const FOOT_MIN_SPEED = 0.02; // これ未満は停止扱い
const FOOT_MAX_SPEED = 1.2; // これ以上は走り相当（上限）

const STEP_WALK = 0.55; // 歩き：1歩あたり秒
const STEP_RUN = 0.28; // 走り：1歩あたり秒

// ===================== 追加：足音の挙動を調整できる倍率 =====================
// 足音用の速度倍率（例：2.0にすると「同じ移動でも速く動いてる扱い」になり、歩幅が詰まる）
let FOOT_SPEED_MUL = 0.8;

// 足音のテンポ倍率（例：0.8で足音が速く、1.2で遅く）
let FOOT_INTERVAL_MUL = 1.6;

// 停止してから足音を切る猶予（秒）。0 にすると停止即カット
const FOOT_STOP_GRACE = 0;

// 停止判定用の蓄積
let _idleAcc = 0;

// （任意）外から倍率を変えたいとき用
window.setFootstepMul = (speedMul = 1.0, intervalMul = 1.0) => {
  FOOT_SPEED_MUL = Math.max(0, speedMul);
  FOOT_INTERVAL_MUL = Math.max(0.01, intervalMul);
};

function playBoonSound() {
  if (!soundArmed || !boonSound || !boonSoundReady) return;
  if (boonSound.isPlaying) boonSound.stop();
  boonSound.play();
}


// ============================================================
// 1) 懐中電灯（スポットライト）
// ============================================================
const FLASHLIGHT_BASE_INTENSITY = 10;
const flashlight = new THREE.SpotLight(0xffffff, FLASHLIGHT_BASE_INTENSITY, 10, (30 * Math.PI) / 180, 0.6, 2);
flashlight.castShadow = true;
scene.add(flashlight);
scene.add(flashlight.target);

flashlight.shadow.bias = -0.0005;
flashlight.shadow.normalBias = 0.02;

// スポットライトのチカチカ制御
let flashlightFlickerActive = false;
let flashlightFlickerIntensity = FLASHLIGHT_BASE_INTENSITY;
let flashlightFlickerNextAt = 0;

function startFlashlightFlicker() {
  flashlightFlickerActive = true;
  flashlightFlickerNextAt = 0;
}

function stopFlashlightFlicker() {
  flashlightFlickerActive = false;
  flashlight.intensity = FLASHLIGHT_BASE_INTENSITY;
}

// ============================================================
// 拡大/縮小 UI
// ============================================================
const section = document.getElementById("three-section");
const expandBtn = document.getElementById("expand-btn");
const shrinkBtn = document.getElementById("shrink-btn");

let ctrlX = canvas.clientWidth * 0.1;
let ctrlY = canvas.clientHeight * 0.8;

function enterFullscreen() {
  section.classList.remove("banner");
  section.classList.add("fullscreen");

  document.body.style.overflow = "hidden";

  expandBtn.hidden = false;
  expandBtn.textContent = "拡小";
  shrinkBtn.hidden = true;

  ctrlX = canvas.clientWidth * 0.1;
  ctrlY = canvas.clientHeight * 0.8;

  ctrl_ui.style.left = ctrlX + "px";
  ctrl_ui.style.top = ctrlY + "px";

  ctrl_aria.style.left = ctrlX + "px";
  ctrl_aria.style.top = ctrlY + "px";

  updateSize();
}

function exitFullscreen() {
  section.classList.remove("fullscreen");
  section.classList.add("banner");

  document.body.style.overflow = "";

  expandBtn.hidden = false;
  expandBtn.textContent = "拡大";
  shrinkBtn.hidden = true;

  ctrlX = canvas.clientWidth * 0.1;
  ctrlY = canvas.clientHeight * 0.8;

  ctrl_ui.style.left = ctrlX + "px";
  ctrl_ui.style.top = ctrlY + "px";

  ctrl_aria.style.left = ctrlX - 25 + "px";
  ctrl_aria.style.top = ctrlY - 25 + "px";

  updateSize();
}

expandBtn.addEventListener("click", () => {
  if (section.classList.contains("fullscreen")) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
});
shrinkBtn.addEventListener("click", exitFullscreen);

expandBtn.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    if (section.classList.contains("fullscreen")) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  },
  { passive: false }
);

shrinkBtn.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    exitFullscreen();
  },
  { passive: false }
);

// ============================================================
// GLTF ローダ & マップ読み込み
// ============================================================
const loader = new GLTFLoader();
const clock = new THREE.Clock();

// 1) マップ表示
const mapGltf = await loader.loadAsync("glb/horror_map.glb");
const mapRoot = mapGltf.scene;
scene.add(mapRoot);

// ============================================================
// ========= SCENARIO (A→停止×2→hunt_anim + B追尾→範囲2で停止+ hunt2_anim) =========
// ============================================================

// ▼ここだけ名前をあなたのglb内の実名に変える
const OBJECT_A_NAME = "chair";
const OBJECT_B_NAME = "モニター";

// ▼範囲1/2
const RANGE1_CENTER = new THREE.Vector3(-2.9, 1.5, -7.55);
const RANGE1_RADIUS = 0.3;

const RANGE2_CENTER = new THREE.Vector3(-3.7, 1.5, -9.91);
const RANGE2_RADIUS = 0.6;

// ▼「Aを見たら止める」判定の許容角度
const LOOK_AT_A_TOL_DEG = 12;

// ▼A の動き
const A_MOVE_DIR_WORLD = new THREE.Vector3(0.5, 0, 0);
const A_SPEED = 0.3;
const A_STOP_SMOOTH = 1.5;

// ▼B の追尾
const B_CHASE_SPEED = 1.2;

// ▼「プレイヤーが動いた」判定
const PLAYER_MOVE_EPS = 0.3;

// シナリオ本体
async function setupHuntScenario({ mapRoot, player, camera, objectA, objectB }) {
  // このシナリオ専用 mixer（mapRoot へバインド）
  const mixer = new THREE.AnimationMixer(mapRoot);

  async function loadAllActionsOnce(animUrl) {
    const gltf = await loader.loadAsync(animUrl);
    if (!gltf.animations || gltf.animations.length === 0) {
      throw new Error(`${animUrl} にアニメーションが入っていません。`);
    }
    return gltf.animations.map((clip) => {
      const a = mixer.clipAction(clip);
      a.setLoop(THREE.LoopOnce, 1);
      a.clampWhenFinished = true;
      return a;
    });
  }

  const hunt1Actions = await loadAllActionsOnce("glb/hunt_anim.glb");
  const hunt2Actions = await loadAllActionsOnce("glb/hunt2_anim.glb");

  function playActionsOnce(actions, fadeIn = 0.1) {
    for (const a of actions) {
      a.reset();
      a.fadeIn(fadeIn);
      a.play();
    }
  }

  // ---- 共有ベクトル/変数（ここで1回だけ作る）
  const _p = new THREE.Vector3(); // player位置などの作業用
  const _lastPlayer = new THREE.Vector3(); // 計測開始位置
  player.getWorldPosition(_lastPlayer);

  // ★Aが止まった瞬間に呼ぶ：ここから距離計測開始
  function armPlayerMoveCheck() {
    player.getWorldPosition(_lastPlayer);
  }

  // ★プレイヤーが一定距離動いたか
  function playerMovedNow() {
    player.getWorldPosition(_p);
    const moved = _p.distanceToSquared(_lastPlayer) >= PLAYER_MOVE_EPS * PLAYER_MOVE_EPS;
    if (moved) _lastPlayer.copy(_p);
    return moved;
  }

  // ---- range判定（同じ _p を使う）
  function inRange(center, radius) {
    player.getWorldPosition(_p);
    return _p.distanceToSquared(center) <= radius * radius;
  }

  // ---- 視線がAに向いた判定
  const _camPos = new THREE.Vector3();
  const _aPos = new THREE.Vector3();
  const _camDir = new THREE.Vector3();
  const _toA = new THREE.Vector3();

  function lookAtAReached() {
    camera.getWorldPosition(_camPos);
    objectA.getWorldPosition(_aPos);
    camera.getWorldDirection(_camDir).normalize();
    _toA.copy(_aPos).sub(_camPos).normalize();

    const dot = THREE.MathUtils.clamp(_camDir.dot(_toA), -1, 1);
    const ang = THREE.MathUtils.radToDeg(Math.acos(dot));
    return ang <= LOOK_AT_A_TOL_DEG;
  }

  // ---- Aの移動（速度を徐々に0へ）
  let aSpeedCur = 0;
  let aSpeedTarget = 0;

  const aDirWorld = A_MOVE_DIR_WORLD.clone().normalize();
  const aDirLocal = new THREE.Vector3();
  const _invParentA = new THREE.Matrix4();

  function setADirLocalFromWorld() {
    if (!objectA.parent) {
      aDirLocal.copy(aDirWorld);
      return;
    }
    _invParentA.copy(objectA.parent.matrixWorld).invert();
    aDirLocal.copy(aDirWorld).transformDirection(_invParentA).normalize();
  }
  setADirLocalFromWorld();

  function aStart() {
    aSpeedTarget = A_SPEED;
  }
  function aStopGradually() {
    aSpeedTarget = 0;
  }
  function aIsStopped() {
    return Math.abs(aSpeedCur) < 0.001 && Math.abs(aSpeedTarget) < 0.001;
  }

  // ---- B追尾（プレイヤーへ来る）
  let bChasing = false;
  const _bWorld = new THREE.Vector3();
  const _dirWorld = new THREE.Vector3();
  const _dirLocal = new THREE.Vector3();
  const _invParentB = new THREE.Matrix4();

  function bStartChase() {
    bChasing = true;
  }
  function bStopChase() {
    bChasing = false;
  }

  function updateBChase(dt) {
    if (!bChasing) return;

    objectB.getWorldPosition(_bWorld);
    player.getWorldPosition(_p);

    _dirWorld.copy(_p).sub(_bWorld);
    const len = _dirWorld.length();
    if (len < 1e-6) return;
    _dirWorld.multiplyScalar(1 / len);

    if (!objectB.parent) {
      objectB.position.addScaledVector(_dirWorld, B_CHASE_SPEED * dt);
      return;
    }

    _invParentB.copy(objectB.parent.matrixWorld).invert();
    _dirLocal.copy(_dirWorld).transformDirection(_invParentB).normalize();
    objectB.position.addScaledVector(_dirLocal, B_CHASE_SPEED * dt);
  }

  // ---- 状態（2回分）
  const State = {
    WAIT_RANGE1: 0,
    A_MOVING_1: 1,
    A_STOPPING_1: 2,
    WAIT_PLAYER_MOVE_1: 3,

    A_MOVING_2: 4,
    A_STOPPING_2: 5,
    AFTER_STOP2: 6,

    WAIT_RANGE2: 7,
    DONE: 8,
  };

  let state = State.WAIT_RANGE1;
  let hunt1Played = false;
  let hunt2Played = false;

  return function updateScenario() {
    const dt = clock.getDelta();

    // アニメ更新
    mixer.update(dt);

    // A速度の滑らか追従＆移動
    aSpeedCur = THREE.MathUtils.damp(aSpeedCur, aSpeedTarget, A_STOP_SMOOTH, dt);
    objectA.position.addScaledVector(aDirLocal, aSpeedCur * dt);

    // B追尾
    updateBChase(dt);
    updateHuntLightFade(dt);

    switch (state) {
      case State.WAIT_RANGE1:
        if (inRange(RANGE1_CENTER, RANGE1_RADIUS)) {
          aStart();
          state = State.A_MOVING_1;
        }
        break;

      case State.A_MOVING_1:
        if (lookAtAReached()) {
          aStopGradually();
          state = State.A_STOPPING_1;
        }
        break;

      case State.A_STOPPING_1:
        if (aIsStopped()) {
          armPlayerMoveCheck(); // ★止まった瞬間から計測開始
          state = State.WAIT_PLAYER_MOVE_1;
        }
        break;

      case State.WAIT_PLAYER_MOVE_1:
        if (playerMovedNow()) {
          aStart();
          startFlashlightFlicker();
          state = State.A_MOVING_2;
        }
        break;

      case State.A_MOVING_2:
        if (lookAtAReached()) {
          aStopGradually();
          state = State.A_STOPPING_2;
        }
        break;

      case State.A_STOPPING_2:
        if (aIsStopped()) {
          state = State.AFTER_STOP2;
        }
        break;

      case State.AFTER_STOP2:
        // 2回目停止完了 → hunt_anim と同時にB追尾開始
        if (!hunt1Played) {
          if (!huntLightFadeActive && hunt_light.intensity <= 0.001) {
            startHuntLightFade(HUNT_LIGHT_INTENSITY, HUNT_LIGHT_FADE_IN);
          }
          if (!huntLightFadeActive && hunt_light.intensity >= HUNT_LIGHT_INTENSITY - 0.001) {
            playBoonSound();
            playActionsOnce(hunt1Actions, 0.1);
            hunt1Played = true;
            bStartChase();
            chaseSpeedMul = 2; // ★追いかけられ中は2倍
            state = State.WAIT_RANGE2;
          }
        }
        break;

      case State.WAIT_RANGE2:
        if (inRange(RANGE2_CENTER, RANGE2_RADIUS)) {
          bStopChase();
          chaseSpeedMul = 1; // ★追尾終了で元に戻す
          if (!huntLightFadeActive && hunt_light.intensity > 0.001) {
            startHuntLightFade(0, HUNT_LIGHT_FADE_OUT);
          }
          stopFlashlightFlicker();
          if (!hunt2Played) {
            playBoonSound();
            playActionsOnce(hunt2Actions, 0.1);
            hunt2Played = true;
          }
          state = State.DONE; // そのまま終わる
        }
        break;

      case State.DONE:
      default:
        break;
    }
  };
}

// ============================================================
// 環境・ライト（あなたの元コードをそのまま）
// ============================================================
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// PMREMGenerator を一つだけ作って使い回す
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// 入り口ライト（例）
const pointLight = new THREE.PointLight(0xffa113, 1, 2, 2);
pointLight.position.set(0.101394, 1.11778, 0.7);
scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0xffa113, 1, 2, 2);
pointLight2.position.set(0.101394, 1.11778, -0.642505);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xffa113, 1, 2, 2);
pointLight3.position.set(-2.56631, 1.11778, 0.7);
scene.add(pointLight3);

const pointLight4 = new THREE.PointLight(0xffa113, 1, 2, 2);
pointLight4.position.set(-2.56631, 1.11778, -0.642505);
scene.add(pointLight4);

const pointLight_red = new THREE.PointLight(0xff2620, 3, 6, 2);
pointLight_red.position.set(-5.92211, 1.78947, 0.05);
pointLight_red.castShadow = true;
pointLight_red.shadow.mapSize.set(256, 256);
pointLight_red.shadow.bias = -1;
scene.add(pointLight_red);

// ============================================================
// UI停止など
// ============================================================
const raycaster = new THREE.Raycaster();
let pause = false;

const buttons = document.querySelectorAll("button");
buttons.forEach((btn) => {
  btn.addEventListener("mouseenter", () => (pause = true));
  btn.addEventListener("mouseleave", () => (pause = false));
});
buttons.forEach((btn) => {
  btn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      pause = true;
    },
    { passive: false }
  );
  btn.addEventListener("touchend", () => (pause = false));
  btn.addEventListener("touchcancel", () => (pause = false));
});

// モード状態（例）
let OperationMode = 0;
let objectEditMode = "Standby";

// ============================================================
// 視点操作（あなたの元コード）
// ============================================================
const ctrl_ui = document.getElementById("controller");
const ctrl_aria = document.getElementById("controller-area");
let lastPosition1 = { x: 0, y: 0 };

let camera_num = 1;
let ctrl_num = 0;
let ctrl_id = null;

async function search_ctrl_num(e) {
  const touches = e.touches;

  for (let i = 0; i < touches.length; i++) {
    const touch = e.touches[i];
    const rect = canvas.getBoundingClientRect();
    const xPx = touch.clientX - rect.left;
    const yPx = touch.clientY - rect.top;

    if (40 > Math.sqrt((ctrlX - xPx) ** 2 + (ctrlY - yPx) ** 2)) {
      if (ctrl_id === null) {
        ctrl_id = e.changedTouches[0].identifier;
        ctrl_num = i;
        camera_num = (ctrl_num + 1) % 2;
      }
    }
  }
}

// マウス座標
const mouse = new THREE.Vector2();

function handleMouseMove(x, y) {
  const element = canvas;
  const clientX = x - element.offsetLeft;
  const clientY = y - element.offsetTop;
  const w = element.offsetWidth;
  const h = element.offsetHeight;
  mouse.x = (clientX / w) * 2 - 1;
  mouse.y = -(clientY / h) * 2 + 1;
}

// タッチ/マウス
const handleTouchStart = async (e) => {
  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);

  await search_ctrl_num(e);

  if (e.changedTouches[0].identifier != ctrl_id && e.touches.length <= 2) {
    lastPosition1 = {
      x: e.touches[e.touches.length - 1].clientX,
      y: e.touches[e.touches.length - 1].clientY,
    };
  }

  if (OperationMode === 0) return;

  if (objectEditMode === "MOVE_EXISTING") {
    // dragging = null;
    // onerun_search_point();
  }
};

const handleDocumentMouseMove = (e) => {
  handleMouseMove(e.clientX, e.clientY);
};

const handleTouchMove = (e) => {
  e.preventDefault();

  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);

  if (e.touches.length === 1) {
    if (ctrl_id === null) {
      if (lastPosition1 === undefined) {
        lastPosition1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }

      const dx = lastPosition1.x - e.touches[0].clientX;
      const dy = lastPosition1.y - e.touches[0].clientY;

      const angle2 = Math.atan2(dx, dy);
      const range = Math.sqrt(dx ** 2 + dy ** 2);

      cameraAngleY += Math.sin(angle2) * range * 0.005;
      cameraAngleX += Math.cos(angle2) * range * 0.005;
      cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));

      lastPosition1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const xPx = touch.clientX - rect.left;
      const yPx = touch.clientY - rect.top;

      const dx = ctrlX - xPx;
      const dy = ctrlY - yPx;

      const angley = cameraAngleY + Math.atan2(dx, dy);
      const range = Math.sqrt(dx ** 2 + dy ** 2);
      moveVectorX = Math.sin(angley) * range * 0.01;
      moveVectorZ = Math.cos(angley) * range * 0.01;

      const ctrl_angle = Math.atan2(dx, dy);
      ctrl_ui.style.left = ctrlX - Math.sin(ctrl_angle) * Math.min(40, range) + "px";
      ctrl_ui.style.top = ctrlY - Math.cos(ctrl_angle) * Math.min(40, range) + "px";
    }
  } else if (e.touches.length >= 2) {
    if (ctrl_id === null) return;

    const cdx = lastPosition1.x - e.touches[camera_num].clientX;
    const cdy = lastPosition1.y - e.touches[camera_num].clientY;
    const angle2 = Math.atan2(cdx, cdy);
    const crange = Math.sqrt(cdx ** 2 + cdy ** 2);

    cameraAngleY += Math.sin(angle2) * crange * 0.005;
    cameraAngleX += Math.cos(angle2) * crange * 0.005;
    cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));

    lastPosition1 = { x: e.touches[camera_num].clientX, y: e.touches[camera_num].clientY };

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const xPx = touch.clientX - rect.left;
    const yPx = touch.clientY - rect.top;

    const dx = ctrlX - xPx;
    const dy = ctrlY - yPx;

    const angley = cameraAngleY + Math.atan2(dx, dy);
    const range = Math.sqrt(dx ** 2 + dy ** 2);
    moveVectorX = Math.sin(angley) * range * 0.01;
    moveVectorZ = Math.cos(angley) * range * 0.01;

    const ctrl_angle = Math.atan2(dx, dy);
    ctrl_ui.style.left = ctrlX - Math.sin(ctrl_angle) * Math.min(40, range) + "px";
    ctrl_ui.style.top = ctrlY - Math.cos(ctrl_angle) * Math.min(40, range) + "px";
  }
};

const handleTouchEnd = (e) => {
  if (ctrl_id === e.changedTouches[0].identifier) {
    ctrl_id = null;
    ctrl_num = null;
    moveVectorX = 0;
    moveVectorZ = 0;
    ctrl_ui.style.left = ctrlX + "px";
    ctrl_ui.style.top = ctrlY + "px";
  } else {
    ctrl_num = 0;
    camera_num = 1;

    if (e.touches.length > 0) {
      lastPosition1 = {
        x: e.touches[e.touches.length - 1].clientX,
        y: e.touches[e.touches.length - 1].clientY,
      };
    }
  }
};

// ============================================================
// キーボード・移動（あなたの元コード）
// ============================================================
let baseSpeed = 0.0125;
let beseRotate = 0.02;
const pitchLimit = Math.PI / 2 - 0.1;

let keys = {};
const scrollBlockKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "space", "pageup", "pagedown", "home", "end"];

function keyDownHandler(e) {
  const key = e.key.toLowerCase();
  keys[key] = true;
  if (scrollBlockKeys.includes(key)) e.preventDefault();
}
function keyUpHandler(e) {
  const key = e.key.toLowerCase();
  keys[key] = false;
  if (scrollBlockKeys.includes(key)) e.preventDefault();
}

function enableKeyControl() {
  document.addEventListener("keydown", keyDownHandler, { passive: false });
  document.addEventListener("keyup", keyUpHandler, { passive: false });
}
function disableKeyControl() {
  document.removeEventListener("keydown", keyDownHandler);
  document.removeEventListener("keyup", keyUpHandler);
}

// カメラ制御
let cameraAngleY = (270 * Math.PI) / 180;
let cameraAngleX = Math.PI / 180;
let moveVectorX = 0;
let moveVectorZ = 0;

// camera.rotation.x = cameraAngleY
camera.rotation.y = (90 * Math.PI) / 180;

camera.position.x = 2.51768;
camera.position.y = 1.50294;
camera.position.z = 0.05;

// ボタンUI（速度切替）
let speedUp = false;
let moveUp = false;
let moveDown = false;

document.getElementById("speed-up").addEventListener("touchstart", () => (speedUp = true));
document.getElementById("speed-up").addEventListener("mousedown", () => (speedUp = true));

document.getElementById("speed-down").style.display = "none";
document.getElementById("speed-down").addEventListener("touchstart", () => (speedUp = true));
document.getElementById("speed-down").addEventListener("mousedown", () => (speedUp = true));

document.getElementById("btn-up").addEventListener("touchstart", () => (moveUp = true));
document.getElementById("btn-up").addEventListener("touchend", () => (moveUp = false));
document.getElementById("btn-down").addEventListener("touchstart", () => (moveDown = true));
document.getElementById("btn-down").addEventListener("touchend", () => (moveDown = false));

document.getElementById("btn-up").addEventListener("mousedown", () => (moveUp = true));
document.getElementById("btn-up").addEventListener("mouseup", () => (moveUp = false));
document.getElementById("btn-down").addEventListener("mousedown", () => (moveDown = true));
document.getElementById("btn-down").addEventListener("mouseup", () => (moveDown = false));

// ============================================================
// 初期 fullscreen 状態
// ============================================================
exitFullscreen();

// ============================================================
// シナリオ + 音 初期化（※ ここで1回だけ起動）
// ============================================================
let updateScenario = null;

// player は camera
const player = camera;

// glb内の物体を取得
const objectA = mapRoot.getObjectByName(OBJECT_A_NAME);
const objectB = mapRoot.getObjectByName(OBJECT_B_NAME);

const hunt_light = new THREE.PointLight(0xff0000, 2, 2); // color, intensity, distance
hunt_light.position.set(0.8009469880360964, 1.50294 , -2.211183209697237); // 親のローカル位置

const HUNT_LIGHT_INTENSITY = 2;
const HUNT_LIGHT_FADE_IN = 0.8;
const HUNT_LIGHT_FADE_OUT = 0.8;

hunt_light.intensity = 0;
hunt_light.visible = false; // OFF

// X : 0.8084182097303013, Y : 1.50294
objectB.add(hunt_light);       // ← これで子要素になる

let huntLightFadeActive = false;
let huntLightFadeElapsed = 0;
let huntLightFadeDuration = 0;
let huntLightFadeFrom = 0;
let huntLightFadeTo = 0;

function startHuntLightFade(toIntensity, duration) {
  huntLightFadeActive = true;
  huntLightFadeElapsed = 0;
  huntLightFadeDuration = Math.max(0.01, duration);
  huntLightFadeFrom = hunt_light.intensity;
  huntLightFadeTo = toIntensity;
  hunt_light.visible = true;
}

function updateHuntLightFade(dt) {
  if (!huntLightFadeActive) return false;
  huntLightFadeElapsed += dt;
  const t = Math.min(1, huntLightFadeElapsed / huntLightFadeDuration);
  hunt_light.intensity = THREE.MathUtils.lerp(huntLightFadeFrom, huntLightFadeTo, t);
  if (t >= 1) {
    huntLightFadeActive = false;
    if (huntLightFadeTo <= 0.001) hunt_light.visible = false;
    return true;
  }
  return false;
}

console.log("objectA:", objectA);
console.log("objectB:", objectB);

(async () => {
  if (!objectA || !objectB) {
    console.error("ObjectA/ObjectB が見つかりません。OBJECT_A_NAME / OBJECT_B_NAME を修正してください。");
    return;
  }

  // ---- 音セット（objectAが確実に存在する場所）
  // ★listener / audioLoader をグローバルに保持（スコープ事故防止）
  listener = new THREE.AudioListener();
  camera.add(listener);

  audioLoader = new THREE.AudioLoader();

  // ---- アニメ開始音
  boonSound = new THREE.Audio(listener);
  audioLoader.load("sound/boon.mp3", (buffer) => {
    boonSound.setBuffer(buffer);
    boonSound.setLoop(false);
    boonSound.setVolume(0.7);
    boonSoundReady = true;
  });

  // ---- 足音（耳元で鳴らす：THREE.Audio）
  const FOOTSTEP_FILES = ["sound/footsteps1.mp3", "sound/footsteps2.mp3", "sound/footsteps3.mp3"];
  footSound = new THREE.Audio(listener);
  footSound.setLoop(false); // 1歩ごとに鳴らす
  footSound.setVolume(0.0); // update側で調整
  footSoundBuffers = new Array(FOOTSTEP_FILES.length);

  let pendingFootLoads = FOOTSTEP_FILES.length;
  FOOTSTEP_FILES.forEach((file, idx) => {
    audioLoader.load(file, (buffer) => {
      footSoundBuffers[idx] = buffer;
      pendingFootLoads -= 1;
      if (pendingFootLoads === 0) footSoundReady = true;
    });
  });

  camera.getWorldPosition(_footPrev);

  // ---- 椅子の移動音（既存）
  const moveSound = new THREE.PositionalAudio(listener);

  audioLoader.load("sound/horror_chair.mp3", (buffer) => {
    moveSound.setBuffer(buffer);
    moveSound.setLoop(true);
    moveSound.setVolume(0.6);
    moveSound.setRefDistance(2);
  });

  objectA.add(moveSound);

  const prevPos = new THREE.Vector3();
  const curPos = new THREE.Vector3();
  objectA.getWorldPosition(prevPos);

  const MOVE_EPS = 0.0005;

  window.__updateMoveSound = function updateMoveSound() {
    objectA.getWorldPosition(curPos);
    const dist = curPos.distanceTo(prevPos);
    prevPos.copy(curPos);

    const moving = dist > MOVE_EPS;
    if (moving) {
      if (soundArmed && !moveSound.isPlaying) moveSound.play();
    } else {
      if (moveSound.isPlaying) moveSound.pause();
    }
  };

  // ---- 足音更新（速度に応じてステップ間隔・音量・ピッチを変える）
  window.__updateFootsteps = function updateFootsteps(dt) {
    if (!soundArmed) return;
    if (!footSound || !footSoundReady) return;

    // 現在位置（水平移動のみ）
    camera.getWorldPosition(_footCur);
    const dx = _footCur.x - _footPrev.x;
    const dz = _footCur.z - _footPrev.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    _footPrev.copy(_footCur);

    // 速度（距離/秒）※倍率を反映
    const rawSpeed = dt > 0 ? dist / dt : 0;
    const speed = rawSpeed * FOOT_SPEED_MUL;

    // ---- 停止扱い：途中でも足音を強制停止できるようにする
    if (speed < FOOT_MIN_SPEED) {
    _idleAcc += dt;

    // 猶予を超えたら足音を即カット
    if (_idleAcc >= FOOT_STOP_GRACE) {
        _stepAcc = 0;
        if (footSound.isPlaying) footSound.stop(); // ★途中でも停止
    }
    return;
    }

    // 動いてるなら停止蓄積をリセット
    _idleAcc = 0;

    // 速度を0..1に正規化（歩き→走り）
    const t = THREE.MathUtils.clamp(
    (speed - FOOT_MIN_SPEED) / (FOOT_MAX_SPEED - FOOT_MIN_SPEED),
    0,
    1
    );

    // 速度が上がるほど、1歩の間隔を短く（さらにテンポ倍率も反映）
    const baseInterval = THREE.MathUtils.lerp(STEP_WALK, STEP_RUN, t);
    const interval = baseInterval * FOOT_INTERVAL_MUL;

    _stepAcc -= dt;
    if (_stepAcc <= 0) {
    _stepAcc += interval;

    // 速度が上がるほど、音量・再生速度を少し上げる（=音の長さが短くなる）
    footSound.setVolume(THREE.MathUtils.lerp(0.25, 0.65, t));
    footSound.setPlaybackRate(THREE.MathUtils.lerp(0.8, 1.35, t));

    // 1歩ごとに鳴らす（連打でも前の音を切る）
    if (footSound.isPlaying) footSound.stop();

    const bufferCount = footSoundBuffers.length;
    if (bufferCount > 0) {
      let nextIndex = Math.floor(Math.random() * bufferCount);
      if (bufferCount > 1) {
        while (nextIndex === lastFootIndex) {
          nextIndex = Math.floor(Math.random() * bufferCount);
        }
      }
      footSound.setBuffer(footSoundBuffers[nextIndex]);
      lastFootIndex = nextIndex;
    }

    footSound.play();
    }
  };

  // ---- シナリオ起動
  updateScenario = await setupHuntScenario({ mapRoot, player, camera, objectA, objectB });
})();

// ============================================================
// アニメーションループ
// ============================================================
let run_STOP = false;

function animate() {
  if (run_STOP) return;

  requestAnimationFrame(animate);

  const moveSpeed = baseSpeed * chaseSpeedMul;
  const rotateSpeed = beseRotate * chaseSpeedMul;

  // キーボード移動
  const strafe = (keys["a"] ? 1 : 0) - (keys["d"] ? 1 : 0);
  const forward = (keys["w"] ? 1 : 0) - (keys["s"] ? 1 : 0);

  // 横移動
  camera.position.x += Math.sin(cameraAngleY + Math.PI / 2) * moveSpeed * strafe;
  camera.position.z += Math.cos(cameraAngleY + Math.PI / 2) * moveSpeed * strafe;

  // 前後移動
  camera.position.x += Math.sin(cameraAngleY) * moveSpeed * forward;
  camera.position.z += Math.cos(cameraAngleY) * moveSpeed * forward;

  // スティック入力（カメラ基準移動）
  camera.position.x += moveVectorX * moveSpeed;
  camera.position.z += moveVectorZ * moveSpeed;

  // 速度切替
  if (speedUp) {
    if (baseSpeed === 0.1) {
      baseSpeed = 0.9;
      document.getElementById("speed-up").style.display = "none";
      document.getElementById("speed-down").style.display = "block";
    } else {
      baseSpeed = 0.1;
      document.getElementById("speed-up").style.display = "block";
      document.getElementById("speed-down").style.display = "none";
    }
    speedUp = false;
  }

  // 上下移動（Q/E）
  if (keys["q"] || moveUp) camera.position.y += moveSpeed * 0.5;
  if (keys["e"] || moveDown) camera.position.y -= moveSpeed * 0.5;

  // 回転
  if (keys["arrowleft"]) cameraAngleY += rotateSpeed;
  if (keys["arrowright"]) cameraAngleY -= rotateSpeed;
  if (keys["arrowup"]) cameraAngleX += rotateSpeed;
  if (keys["arrowdown"]) cameraAngleX -= rotateSpeed;

  cameraAngleX = Math.max(-pitchLimit, Math.min(pitchLimit, cameraAngleX));

  // 視線方向
  const direction = new THREE.Vector3(
    Math.sin(cameraAngleY) * Math.cos(cameraAngleX),
    Math.sin(cameraAngleX),
    Math.cos(cameraAngleY) * Math.cos(cameraAngleX)
  );

  tmpTarget.copy(camera.position).add(direction);
  camera.lookAt(tmpTarget);

  // 懐中電灯
  flashlight.position.copy(camera.position);
  flashlight.target.position.copy(tmpTarget);
  flashlight.target.updateMatrixWorld();
  if (flashlightFlickerActive) {
    const now = performance.now() / 1000;
    if (now >= flashlightFlickerNextAt) {
      const intensityMul = THREE.MathUtils.lerp(0.35, 1.05, Math.random());
      flashlightFlickerIntensity = FLASHLIGHT_BASE_INTENSITY * intensityMul;
      flashlightFlickerNextAt = now + THREE.MathUtils.lerp(0.03, 0.12, Math.random());
    }
    flashlight.intensity = flashlightFlickerIntensity;
  } else {
    flashlight.intensity = FLASHLIGHT_BASE_INTENSITY;
  }

  // ビューポート
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width, height);
  renderer.setScissorTest(true);

  renderer.render(scene, camera);

  // シナリオ + 音
  if (updateScenario) updateScenario();
  if (window.__updateMoveSound) window.__updateMoveSound();

  // 足音（移動速度に応じて）
  const dtFoot = footClock.getDelta();
  if (window.__updateFootsteps) window.__updateFootsteps(dtFoot);

  // ここは重いけど、あなたの元コード通り残す
  updateSize();

//   console.log('position | X : ' + camera.position.x + ', Y : ' + camera.position.y, ', Z : ' + camera.position.z )

//   X : 0.953662077690662, Y : 1.50294
}

// ============================================================
// 公開API（あなたの元コード）
// ============================================================
const toggleBtn = document.getElementById("toggle-daynight");

export async function horror_VewStart(one = false) {
  await new Promise((resolve) => setTimeout(resolve, 0));

  run_STOP = false;
  keys = {};

  window.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("mousemove", handleDocumentMouseMove);
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);

  enableKeyControl();
  updateSize();
  exitFullscreen()
  

  if (one){
    toggleBtn.innerHTML = "🔴描画停止中...<br>🔴カーソルまたは指を描画領域へ入れると描画されます。";
  
    renderer.render(scene, camera);
    horror_VewStop()

  } else {
    toggleBtn.innerHTML = "⚠️音をお付けください。⚠️<br>🔴心臓の弱い方はご遠慮ください。";
  
    renderer.render(scene, camera);
    animate();
  }
}

export function horror_VewStop() {
  run_STOP = true;
  lastPosition1 = undefined;

  window.removeEventListener("touchstart", handleTouchStart, { passive: false });
  document.removeEventListener("mousemove", handleDocumentMouseMove);
  document.removeEventListener("touchmove", handleTouchMove, { passive: false });
  document.removeEventListener("touchend", handleTouchEnd);

  disableKeyControl();

  // 念のため元に戻す
  chaseSpeedMul = 1;
  stopFlashlightFlicker();

  // 足音停止
  if (footSound && footSound.isPlaying) footSound.stop();
  _stepAcc = 0;
}

// ユーザー操作後に音を許可
window.addEventListener(
  "pointerdown",
  () => {
    soundArmed = true;

    // iOS等でAudioContextがsuspendedの場合に復帰
    if (listener && listener.context && listener.context.state === "suspended") {
      listener.context.resume();
    }
  },
  { once: true }
);
