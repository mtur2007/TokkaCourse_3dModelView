// ====== Imports ======
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

// ====== Three.js 基本セットアップ ======

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas });

// const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
camera.position.set(8, 6, 12);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

let envMap
const textur_loader = new THREE.TextureLoader();
textur_loader.load('textures/moon_lab.jpg', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    scene.environment = texture;
    envMap = texture;
  });

let envMapNight
textur_loader.load('textures/night.jpg', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    scene.environment = texture;
    envMapNight = texture;
  });

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

// ライト
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(6, 12, 8);
dir.castShadow = true;
dir.shadow.mapSize.set(2048, 2048);
scene.add(dir);

// マテリアル共通
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.9, metalness: 0.0 });
const ballMat   = new THREE.MeshStandardMaterial({ color: 0xffcc55, roughness: 0.4, metalness: 0.1 });

// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 地面（見た目）
const groundMesh = new THREE.Mesh(
  new THREE.BoxGeometry(100, 2, 100),
  groundMat,
);
groundMesh.receiveShadow = true;
groundMesh.position.y = -1;
scene.add(groundMesh);

// 軽い目印のグリッド
const grid = new THREE.GridHelper(100, 100, 0x5577aa, 0x224466);
grid.position.y = -0.99;
scene.add(grid);

// ボール（見た目）
// const radius = 0.3;
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

const gltf = await loader.loadAsync('dai.glb');
const root = gltf.scene;
scene.add(root);

// 階層のスケール/回転/位置をワールド行列に反映
root.updateMatrixWorld(true);

// 3) Rapier の静的トライメッシュをメッシュごとに作る（子まで探索）
root.traverse((child) => {
  if (!child.isMesh) return;
  const geom = child.geometry;
  if (!geom || !geom.attributes?.position) return;

  // 頂点座標（ローカル）をワールドへ変換してから Rapier に渡す
  const pos = geom.attributes.position;
  const vertexCount = pos.count;

  // 頂点（x,y,zのフラット配列）を作成
  const vertices = new Float32Array(vertexCount * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < vertexCount; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
    vertices[i * 3 + 0] = v.x;
    vertices[i * 3 + 1] = v.y;
    vertices[i * 3 + 2] = v.z;
  }

  // インデックス（三角形の頂点番号列）
  let indices;
  if (geom.index) {
    // 既存のインデックスを流用（Uint32にしておくと安全）
    const src = geom.index.array;
    indices = (src.BYTES_PER_ELEMENT === 4) ? src : new Uint32Array(src);
  } else {
    // 非インデックス化ジオメトリなら、連番インデックスを生成
    // → 3頂点ごとに1三角形を想定
    const triCount = Math.floor(vertexCount / 3);
    indices = new Uint32Array(triCount * 3);
    for (let i = 0; i < triCount * 3; i++) indices[i] = i;
  }

  // Rapier の固定ボディ＋トライメッシュコライダー（地面用途なら fixed 推奨）
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const collider = RAPIER.ColliderDesc.trimesh(vertices, indices);
  world.createCollider(collider, body);
});

// 反発と摩擦のデフォルトを少し設定（床材っぽく）
world.integrationParameters.dt = 1/60; // 固定タイムステップ

// 地面（固定ボディ）
const groundBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0)
);

// コライダー（ここに摩擦などを設定）
const groundCollider = world.createCollider(
  RAPIER.ColliderDesc.cuboid(10, 1, 10)  // 形状
    .setFriction(0.8)                     // 摩擦
    .setRestitution(0.0),                 // 跳ねない
  groundBody                               // ← ここでボディに紐づける
);

// Box の半径指定（幅/2, 高さ/2, 奥行き/2）
const groundCol = RAPIER.ColliderDesc.cuboid(50, 1, 50)
  .setFriction(0.9)
  .setRestitution(0.1);
world.createCollider(groundCol, groundBody);

// ボール（動的ボディ）
const ballBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 3, 0)
);
ballBody.enableCcd(true); // すり抜け防止
const ballCol = RAPIER.ColliderDesc.ball(radius)
  .setFriction(0.6)
  .setRestitution(0.55)
  // .setDensity(7800)
  .setDensity(2000)
  // .setMass(0.6); // 7800 kg/m^3 をそのまま使うと「ほぼリアル鉄」
world.createCollider(ballCol, ballBody);

// ====== 入力：投げる／リセット ======
function throwForward(power = 8, up = 4) {
  // カメラの向いている方向ベクトルを取得
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.normalize();

  // カメラの少し前（2m先）からボールを出す
  const origin = camera.position.clone().add(dir.clone().multiplyScalar(2));

  // ボールの位置と速度を設定
  ballBody.setTranslation({ x: origin.x, y: origin.y, z: origin.z }, true);

  // dirベクトル方向に投げる + 上方向の力を少し加える
  const velocity = {
    x: dir.x * power,
    y: dir.y * power + up, // 視線に沿って上方向を少し足す
    z: dir.z * power
  };
  ballBody.setLinvel(velocity, true);

  // ボールに軽く回転をつける（視線方向と関係なし）
  ballBody.setAngvel({ x: 3, y: 0.5, z: 0 }, true);
}

function resetBall() {
  ballBody.setTranslation({ x: 0, y: 5, z: 0 }, true);
  ballBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  ballBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

  if (ballBody.resetForces)  ballBody.resetForces(true);
  if (ballBody.resetTorques) ballBody.resetTorques(true);
  
}

addEventListener('keydown', (e) => {
  if (e.code === 'Space') throwForward(8, 4); // 標準投げ
  if (e.code === 'KeyR') resetBall();
});

addEventListener('click', () => {
  // クリック時は少し強めに
  throwForward(12, 5);
});

// ====== ループ ======
const tmp = new THREE.Vector3();

// リサイズ
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// 初期表示：軽く投げておく
// setTimeout(() => throwForward(6, 3.5), 300);

// ===== 視点 =====

// カメラ操作 ----------------------------------------------------------------

const ctrl_ui = document.getElementById("controller")
let lastPosition1 = { x: 0, y: 0 };

const ctrlX = 160
const ctrlY = canvas.height - 60 - 80
let camera_num = 1
let ctrl_num = 0

let ctrl_id = null

let dragging = false

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
let origin = [0,0]
let origin_reach = 0

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

// Aspect_Ratio = window.innerHeight / window.innerWidth 

// デバッグ用 線描画
function upsertLine(scene, name, start, end, options = {}) {
  const {
    color = 0xff0000,
    linewidth = 1
  } = options;

  // 既に同名のオブジェクトが存在する場合は削除
  const old = scene.getObjectByName(name);
  if (old) {
    old.geometry.dispose();
    old.material.dispose();
    scene.remove(old);
  }

  // start / end を Vector3 に変換
  const s = start.isVector3 ? start : new THREE.Vector3(start.x, start.y, start.z);
  const e = end.isVector3 ? end : new THREE.Vector3(end.x, end.y, end.z);

  const geometry = new THREE.BufferGeometry().setFromPoints([s, e]);
  const material = new THREE.LineBasicMaterial({ color, linewidth });

  const line = new THREE.Line(geometry, material);
  line.name = name; // ← 名前を付ける

  scene.add(line);

  return line;
}

// ジョイコン or 視点 判定 : 物体移動開始
window.addEventListener('mousedown', (e) => {
  
  // UI監視
  handleMouseMove(e.clientX, e.clientY);

  dragging = true
  origin = [mouse.x,mouse.y]
  origin_reach =  0//Math.sqrt(mouse.x**2+mouse.y**2)
  console.log(origin_reach, mouse.x, mouse.y)

  ctrl_ui.style.left = e.clientX + 'px';
  ctrl_ui.style.top = e.clientY + 'px';

}, { passive: false });

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
  // if (OperationMode === 0){return}
  // e.preventDefault();      // ← スクロールを止める
  // if (objectEditMode === 'MOVE_EXISTING') { 
  //   dragging = null//'stand_by';
  //   onerun_search_point();
  // }

  dragging = true
  origin = [mouse.x, mouse.y]
  origin_reach =  0//Math.sqrt(mouse.x**2+mouse.y**2)

  ctrl_ui.style.left = touch.clientX + 'px';
  ctrl_ui.style.top = touch.clientY + 'px';


}, { passive: false });


// 重力を角度指定で決める関数
function gravityFromAngles(theta, phi, g = 9.81) {

  // const theta = THREE.MathUtils.degToRad(thetaDeg); // 方位角
  // const phi   = THREE.MathUtils.degToRad(phiDeg);   // 傾き角

  // 球座標→直交座標
  const gx = g * Math.sin(phi) * Math.cos(theta);
  const gy = -g * Math.cos(phi);
  const gz = g * Math.sin(phi) * Math.sin(theta);

  return { x: gx, y: gy, z: gz };
}

// 位置&視点 操作 : 物体移動追尾
document.addEventListener('mousemove', (e) => {
  
  // UI監視 編集モード
  handleMouseMove(e.clientX, e.clientY);

  if (AngleMode === 'TURNING' && dragging){
  
    // let radius = Math.atan2(mouse.x,mouse.y)

    // let diffX = mouse.x - origin[0]
    // let diffY = mouse.y - origin[1]

    const diff_points = [mouse.x- origin[0],mouse.y- origin[1]]
    const radius = Math.atan2(diff_points[0],diff_points[1])
    const reach = Math.sqrt(diff_points[0]**2 + diff_points[1]**2)

    const beside_incline = Math.sin(radius) * reach
    const vertical_incline = Math.cos(radius) * reach

    // console.log('/_ : '+radius + ' _#_ = : ' + vertical_incline + ' _#_ || : ' + beside_incline)
    // console.log('/_ : '+radius + '[===] : ' + origin_reach + ' {---} : ' + reach_diff)
    // if (radius > 90* Math.PI/180 || radius > 270* Math.PI/180 ){
    //   console.log("//")
    // //   radius = (radius - Math.PI)
    // }
    // const rength = Math.sqrt(mouse.x**2 + mouse.y**2)

    cameraAngleZ = Math.max(Math.min(beside_incline, 30* Math.PI/180), -30* Math.PI/180)
    // console.log(vertical_incline, Math.cos(radius),reach_diff)
    cameraAngleX = Math.min(vertical_incline - 15* Math.PI/180 , 0)

    camera.position.x = 0

    // console.log( Math.sin(vertical_incline * (60*Math.PI/180) + 15*Math.PI/180)* 20)

    // camera.position.z = Math.min(Math.sin((mouse.y - origin[1])*(10*Math.PI/180) + 15*Math.PI/180 ) * 80, 27)
    // camera.position.y = Math.max((mouse.y - origin[1]) * -20 + 10, 0) //Math.cos(vertical_incline) * 20 - 20

    camera.position.z = Math.sin(Math.min(vertical_incline,0.3) * (75*Math.PI/180) + 75*Math.PI/180) * 15 +5

    // console.log(Math.sin(Math.min(vertical_incline,0.3) * (75*Math.PI/180) + 75*Math.PI/180) * 15 +5)

    camera.position.y = Math.cos(Math.min(vertical_incline,0.3) * (75*Math.PI/180) + 75*Math.PI/180) * 15 +5
    
    // console.log(reach)

    // 例：前方(0°)方向に20°傾けた重力
    // const gravityVec = gravityFromAngles(radius - 90*Math.PI/180, Math.max(Math.min(reach*1.1,1),-1));
    // const gravityVec = gravityFromAngles(radius - 90*Math.PI/180, Math.max(Math.min(reach*0.55,0.3),-0.3) );
    // console.log(radius)

    if (false){
      // 1 回目の実行：ラインを追加
      const pulus = 1.8
      const route_Y = radius - Math.PI
      const route_X = (beside_incline*pulus) + Math.PI
      const route_Z = (vertical_incline*pulus) + Math.PI //+ 15* Math.PI/180

      // const reach_hight =  3.8
      const reach_hight =  5

      console.log(beside_incline,Math.PI)

      upsertLine(
        scene,
        "route_Y_Line",
        { x: 0, y: reach_hight, z: 0 },
        { x: Math.sin(route_Y)*-reach_hight, y: reach_hight, z: Math.cos(route_Y)*reach_hight },
        { color: 0x00ff00, linewidth: 10 }
      );
      upsertLine(
        scene,
        "route_Y_sub_Line",
        { x: 0, y: 10, z: 0 },
        { x: 0, y: 0, z: 0},
        { color: 0xff0000, linewidth: 10 }
      );

      upsertLine(
        scene,
        "route_Z_sub_Line",
        { x: 0, y: reach_hight, z: 0 },
        // { x: Math.sin(route_X)*-5, y:  Math.cos(route_X)*5, z: 0},
        // { x: 0, y:  Math.cos(route_Z)*5, z: Math.sin(route_Z)*-5},
        { x:  Math.sin(route_X)*-reach_hight, y:  (Math.cos(route_X)*reach_hight + Math.cos(route_Z)*reach_hight)/2, z: Math.sin(route_Z)*reach_hight},
        { color: 0x0000ff, linewidth: 10 }
      );
    }

    const pulus = 0.8
    const route_X = (beside_incline*pulus) + Math.PI
    const route_Z = (vertical_incline*pulus) + Math.PI //+ 15* Math.PI/180

    // const g = 9.81
    const g = 9.81

    world.gravity = { x:  Math.sin(route_X)*-g, y:  (Math.cos(route_X)*g + Math.cos(route_Z)*g)/2, z: Math.sin(route_Z)*g};
    // world.gravity = gravityVec
    // console.log(radius,vertical_incline)

    // console.log(Math.sin((mouse.y - origin[1])*(10*Math.PI/180) + 15*Math.PI/180 ) * 80)
    // console.log(Math.cos(vertical_incline) * 20)

    // ------

    // const radius = Math.atan2(mouse.x,mouse.y)
    // const reach = Math.sqrt(mouse.x**2+mouse.y**2)

    // const reach_diff = reach - origin_reach

    // const beside_incline = Math.sin(radius) * reach_diff
    // const vertical_incline = Math.cos(radius) * reach_diff

    // cameraAngleZ = Math.max(Math.min(beside_incline, 30* Math.PI/180), -30* Math.PI/180)
    // console.log(vertical_incline, Math.cos(radius),reach_diff)
    // cameraAngleX =Math.min(vertical_incline  - 15* Math.PI/180 , 30* Math.PI/180)

    // camera.position.x = 0
    // camera.position.z = 20
    // console.log(Math.cos(vertical_incline) * 20)
    // camera.position.y = mouse.y * -20 + 10 //Math.cos(vertical_incline) * 20 - 20

  }

});

// レイキャストを作成
const raycaster = new THREE.Raycaster();
let RayHitPoint = [0,0]

document.addEventListener('touchmove', (e) => {

  // e.preventDefault();

  // UI監視
  const touch = e.touches[0];
  handleMouseMove(touch.clientX, touch.clientY);

  // console.log('see'+ dragging)

  // 視点
  if (AngleMode === 'FREE'){
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
  } else if (AngleMode === 'TURNING'){


    const diff_points = [mouse.x- origin[0],mouse.y- origin[1]]
    const radius = Math.atan2(diff_points[0],diff_points[1])
    const reach = Math.sqrt(diff_points[0]**2 + diff_points[1]**2)

    const beside_incline = Math.sin(radius) * reach
    const vertical_incline = Math.cos(radius) * reach

    cameraAngleZ = Math.max(Math.min(beside_incline, 30* Math.PI/180), -30* Math.PI/180)
    cameraAngleX = Math.min(vertical_incline - 15* Math.PI/180 , 0)

    camera.position.x = 0

    camera.position.z = Math.sin(Math.min(vertical_incline,0.3) * (75*Math.PI/180) + 75*Math.PI/180) * 15 +5
    camera.position.y = Math.cos(Math.min(vertical_incline,0.3) * (75*Math.PI/180) + 75*Math.PI/180) * 15 +5
    
    const pulus = 0.8
    const route_X = (beside_incline*pulus) + Math.PI
    const route_Z = (vertical_incline*pulus) + Math.PI //+ 15* Math.PI/180

    const g = 9.81
    world.gravity = { x:  Math.sin(route_X)*-g, y:  (Math.cos(route_X)*g + Math.cos(route_Z)*g)/2, z: Math.sin(route_Z)*g};

    console.log(vertical_incline)

  }

}, { passive: false });

const set_y = 1

function getRayHitPoint(){

  const pos = camera.position

  raycaster.setFromCamera(mouse, camera);
  const dir = raycaster.ray.direction

  const t = Math.abs((pos.y - set_y)/dir.y)
  
  // 交点を計算
  RayHitPoint = [
    pos.x + dir.x * t,
    pos.z + dir.z * t
  ];

}

// 物体移動完了
document.addEventListener('mouseup', () => {
  // dragging = false
});

document.addEventListener('touchend',(e)=>{
  dragging = false
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

// ========= モード切り替え用 UI ========= //

let AngleMode = 'FREE'

export function UIevent (uiID, toggle){
  if ( uiID === 'map' ){ if ( toggle === 'active' ){
    AngleMode = 'FREE'
    console.log( 'map _active' )
  } else {
  console.log( 'map _inactive' )
  }} else if ( uiID === 'games' ){ if ( toggle === 'active' ){
  console.log( 'games _active' )
  } else {
  console.log( 'games _inactive' )
  }} else if ( uiID === 'labyrinth_ball' ){ if ( toggle === 'active' ){
    AngleMode = 'TURNING'
    // camera.rotation.z = 30*Math.PI/180
    
    cameraAngleY = 0
    cameraAngleZ = 0
    // console.log(vertical_incline, Math.cos(radius),reach_diff)
    cameraAngleX = -15* Math.PI/180

    camera.position.x = 0
    camera.position.z = Math.sin(75*Math.PI/180) * 15 +5
    camera.position.y = Math.cos(75*Math.PI/180) * 15 +5
    console.log(AngleMode)

    console.log( 'labyrinth_ball _active' )
  } else {
    cameraAngleY = 0
    cameraAngleZ = 0
    // console.log(vertical_incline, Math.cos(radius),reach_diff)
    cameraAngleX = 0

    camera.position.x = 0
    camera.position.z = 0
    camera.position.y = 0

  console.log( 'labyrinth_ball _inactive' )
  }}
}

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
let cameraAngleZ = 0

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

  // if (AngleMode === 'TURNING'){
  //   getRayHitPoint();
  // }

  // 球体
  // controls.update();

  // サブステップで安定
  for (let i = 0; i < 2; i++) world.step();

  const t = ballBody.translation();
  const r = ballBody.rotation();
  ballMesh.position.set(t.x, t.y, t.z);
  ballMesh.quaternion.set(r.x, r.y, r.z, r.w);



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
  if (AngleMode === 'TURNING'){
    camera.rotation.z = cameraAngleZ
    camera.rotation.x = cameraAngleX
  }

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
