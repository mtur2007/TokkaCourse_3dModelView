import * as THREE from 'three';

// 必ず three と同バージョンの examples モジュールを使う（あなたは three@0.169 を使っているので合わせる）
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/DRACOLoader.js';

export async function WorldCreat(scene){

// ライト作成
const dirLight = new THREE.DirectionalLight(0xffeeee, 3
);
dirLight.name = 'dirLight'

// ライトの位置（光が来る方）
dirLight.position.set(200, 200, 200); // 例: 斜め上（単位はシーンの単位に依存）

// ターゲット（ライトが向く場所）
dirLight.target.position.set(0, 0, 0); // 原点を向かせる例

// ターゲットは scene に追加する必要がある
scene.add(dirLight.target);
scene.add(dirLight);

// // --- 既存の DirectionalLight(dirLight) にシャドウ設定を追加 ---
dirLight.castShadow = true;           // ライトがシャドウを投げる
// dirLight.shadow.mapSize.width = 4000; // 解像度（要調整：2048/1024/4096）
// dirLight.shadow.mapSize.height = 4000;
dirLight.shadow.mapSize.set(4000, 4000); // 必要に応じて解像度を下げる
dirLight.shadow.radius = 4;           // ソフトネス（three r0.150+ で有効）
dirLight.shadow.bias = -0.0005;       // 影のアーティファクト（自動調整必要）
dirLight.shadow.normalBias = 0.5;    // 法線オフセット（改善される場合あり）

// 4) マトリクスを強制更新（これで即時反映）
dirLight.updateMatrixWorld(true);
dirLight.target.updateMatrixWorld(true);

// ----------------- 「床（ground）」を追加して影を受けさせる（GridHelper の下に置く） -----------------
const groundGeo = new THREE.PlaneGeometry(1000, 1000);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0; // 必要ならシーンの床の高さに合わせる
ground.receiveShadow = true; // 影を受ける
ground.name = 'GroundPlane';
scene.add(ground);


// ----------------- シャドウの自動最適化（モデルに合わせてシャドウカメラを調整） -----------------
// モデル読み込み後に呼ぶ関数（root は読み込んだ Group）
function fitDirectionalLightShadowForObject(rootObj, light) {
  const box = new THREE.Box3().setFromObject(rootObj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // シャドウカメラをモデルにフィットさせる（余白 factor を入れる）
  const factor = 1.25;
  const halfWidth = Math.max(size.x, size.z) * factor * 0.5;
  // light.position.set(center.x + size.x * 0.5, center.y + Math.max(size.y, 50), center.z + size.z * 0.5); // ライト位置を調整
  // light.target.position.copy(center);
  // scene.add(light.target);

  light.shadow.camera.left = -halfWidth;
  light.shadow.camera.right = halfWidth;
  light.shadow.camera.top = halfWidth;
  light.shadow.camera.bottom = -halfWidth;

  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = Math.max(500, size.y * 10);
  // light.shadow.mapSize.set(2048, 2048); // 必要に応じて解像度を下げる
  // light.shadow.mapSize.set(4000, 4000); // 必要に応じて解像度を下げる
  light.shadow.bias = -0.0005;
  light.shadow.normalBias = 0.05;
  light.shadow.radius = 4;
  light.shadow.camera.updateProjectionMatrix();
}

// DRACO 使用版（.glb が Draco 圧縮されている／将来使うなら有効化）
const gltfLoader = new GLTFLoader();
const useDraco = true; // Draco を使う場合は true に。未圧縮なら false
if (useDraco) {
  const dracoLoader = new DRACOLoader();
  // CDN のデコーダパス（例）。必要ならローカルの decoder に変えてください
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  gltfLoader.setDRACOLoader(dracoLoader);
}

let car = [null,null,null,null]

/**
 * modelUrl の glb を読み込んでシーンに追加するユーティリティ。
 * - 中心化（大きな座標を原点付近に移す）
 * - 自動スケール（巨大なら縮小）
 * - マテリアルに scene.environment を適用（PBR反射）
 * - シャドウ設定（必要なら有効化）
 */

async function loadModelToScene(modelUrl, options = {}, adjustment=true, sinkansen = 0) {
  const {
    autoCenter = true,
    autoScaleMax = 1000,   // モデルの最大寸法がこの値を超えるなら縮小する閾値
    scaleIfLarge = 0.001,   // 縮小係数（例：0.001）
    castShadow = false,
    receiveShadow = false,
    onProgress = (xhr) => (xhr.total),
  } = options;

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene || gltf.scenes[0];
        if (!root) return reject(new Error('glTF にシーンがありません'));

        // 1) マテリアル側に環境マップをセット（PBRの反射を有効化）
        root.traverse((node) => {
          if (node.isMesh) {
            // ランタイムで環境マップがあれば適用
            // if (scene.environment) {
            //   console.log('run')
            //   // 一部のマテリアルは envMap を直接参照しないことがあるが、通常はこれで反射が得られます
            //   if (node.material) {
            //     console.log('run')
            //     if (Array.isArray(node.material)) {
            //       node.material.forEach(m => {
            //         if (m && 'envMap' in m) {
            //           console.log('run0')
            //           m.envMap = scene.environment;
            //           m.needsUpdate = true;
            //         }
            //       });
            //     } else {
            //       if ('envMap' in node.material) {
            //         node.material.envMap = scene.environment;
            //         node.material.needsUpdate = true;
            //       }
            //     }
            //   }
            // }

            node.material.envMap = scene.ref;
            node.material.needsUpdate = true;

            // シャドウ（重くなる場合は false に）
            node.castShadow = castShadow;
            node.receiveShadow = receiveShadow;

            // GPU負荷低減のために、if necessary, フラグなどを調整してもよい
          }
        });

        // 2) 中心化＋自動縮小（CityGML は世界座標が大きいことが多い）
        if (autoCenter) {
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // 原点に移動
          root.position.sub(center);

          // 必要なら scale を下げる
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > autoScaleMax) {
            root.scale.setScalar(scaleIfLarge);
            console.log(`モデルが大きかったため scale=${scaleIfLarge} を適用しました（maxDim=${maxDim}）`);
          }
        }

        // 手動調整
        
        if (adjustment){
          fitDirectionalLightShadowForObject(root, dirLight);
        }else{
          console.log('false.shadow')
          root.receiveShadow = true
          root.castShadow = true;
        }

        if (adjustment){
          // root.rotation.y = 100 * Math.PI / 180
          root.position.y = 1
          // root.position.set(145,40,-175)
          // root.scale.setScalar(0.45);
        } else {
          root.position.set(0.5,0,0)
          root.scale.setScalar(0.5);
         
          // --- root以下のメッシュに対してマテリアル調整 ---
          root.traverse(o => {
            if (o.isMesh && o.material) {
              // // 例: 環境マップの影響を切りたいメッシュ名
              // if (o.name.includes('平面')) {
              //   // 方法1: 反射(IBL)をゼロ
              //   o.material.envMapIntensity = 0;
              //   // 方法2: さらにマットな質感へ
              //   o.material.metalness = 0.0;
              //   o.material.roughness = 1.0;
              //   o.material.needsUpdate = true;
              // }

              // 別例: サインなど完全Unlitにする
              if (o.name.includes('平面')) {
                const tex = o.material.map;
                o.material = new THREE.MeshBasicMaterial({
                  map: tex,
                  // transparent: true,
                  opacity: 1.0,
                  side: THREE.FrontSide
                });
              }

              // 確認用ログ
              // console.log(o.name, o.material.name || '(no name)', o.material.envMapIntensity);
            }
          });

          car[sinkansen] = root
          
        }

        // ----------------- GLTF 読み込み時に各メッシュのシャドウを有効化（loadModelToScene の traverse 内で） -----------------
        root.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;     // このメッシュが影を落とす
            node.receiveShadow = true;  // このメッシュが影を受ける（床や周囲の建物に有効）
            // 必要に応じてマテリアルの設定（透明など）を行う
            if (Array.isArray(node.material)) {
              node.material.forEach(m => { if (m) m.needsUpdate = true; });
            } else if (node.material) {
              node.material.needsUpdate = true;
            }
          }
        });

        // 3) シーンに追加
        scene.add(root);

        resolve(root);
      },
      onProgress,
      (err) => {
        console.error('GLTF load error', err);
        reject(err);
      }
    );
  });
}

// // --------------- 実行例：model.glb を読み込む ----------------
// ここのファイル名をあなたの .glb の名前に変えてください
loadModelToScene('test.glb', { autoCenter: true, autoScaleMax: 10000, scaleIfLarge: 0.001 })
  .then((root) => {
    console.log('GLB loaded and added to scene:', root);
  })
  .catch((err) => {
    console.error('モデルの読み込みで失敗:', err);
    alert('モデル読み込みに失敗しました。コンソールを確認してください。');
  });
}