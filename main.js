import './style.css'

import * as THREE from 'three';
import * as TWEEN from 'tween.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

const info = document.querySelector('#info');
var coins = 0;


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg')
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 10;
controls.maxDistance = 200;
controls.enablePan = false;
controls.enableDamping = true;

const effect = new OutlineEffect(renderer);
scene.background = new THREE.Color(0x444488);
const color = 0x444488;
const density = 0.005;
scene.fog = new THREE.FogExp2(color, density);

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add(listener);

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(15, 15, 15);
scene.add(pointLight)

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight)

// const lightHelper = new THREE.PointLightHelper(pointLight);
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper)



function createStar() {
  const randomRadius = THREE.MathUtils.randFloat(1, 3)
  const geometry = new THREE.SphereGeometry(randomRadius, 24, 24)
  const material = new THREE.MeshToonMaterial({ color: 0xFF6300 });
  const star = new THREE.Mesh(geometry, material);
  star.name = new Date().getMilliseconds();
  return star;
}

Array(50).fill().forEach(() => {
  const star = createStar();
  const pos = randomPointOnASphere(100);
  star.position.set(pos.x, pos.y, pos.z);
  scene.add(star);
});

function explodeStar(star) {

  // create the PositionalAudio object (passing in the listener)
  const sound = new THREE.PositionalAudio(listener);
  // load a sound and set it as the PositionalAudio object's buffer
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('sounds/splat.mp3', function (buffer) {
    sound.setBuffer(buffer);
    sound.setRefDistance(20);
    sound.detune = THREE.MathUtils.randInt(-200, 300);
    sound.play();
  });

  if (THREE.MathUtils.randInt(0, 100) < 40 || scene.children.length < 10) {

    for (let i = 0; i < THREE.MathUtils.randInt(0, 4); i++) {
      const s = createStar();
      const pos = randomPointOnASphere(3);
      scene.add(s);
      s.position.set(star.position.x + pos.x, star.position.y + pos.y, star.position.z + pos.z);
    }

  }

  let hasCoin, hasTreasure = false;
  if (THREE.MathUtils.randInt(0, 100) < 10) {

    hasCoin = true;

    const soundCoin = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();
    if (THREE.MathUtils.randInt(0, 100) < 5) {
      hasTreasure = true;
      coins += coins;
      info.textContent = coins;
      audioLoader.load('sounds/treasure-coin.wav', function (buffer) {
        soundCoin.setBuffer(buffer);
        soundCoin.setRefDistance(20);
        soundCoin.setVolume(1.2);
        soundCoin.detune = THREE.MathUtils.randInt(0, 20);
        soundCoin.play();
      })
    } else {
      coins += 1;
      info.textContent = coins;
      audioLoader.load('sounds/coin.wav', function (buffer) {
        soundCoin.setBuffer(buffer);
        soundCoin.setRefDistance(20);
        soundCoin.setVolume(2);
        soundCoin.detune = THREE.MathUtils.randInt(0, 20);
        soundCoin.play();
      });
    }
    star.add(sound)
  }


  let animSpeed = 100;
  let explosionColor = 0xffffff;

  if (hasCoin) {

    explosionColor = 0x2eff2f;

    if (hasTreasure) {
      animSpeed = 150;
    } else {
      animSpeed = 120;
    }

  }

  star.add(sound)

  star.material.color.set(explosionColor);

  new TWEEN.Tween(star.scale)
    .to({ x: 2.5, y: 2.5, z: 2.5 }, animSpeed)
    .onComplete(() => {
      star.material.color.set(0x101010);
      new TWEEN.Tween(star.scale)
        .to({ x: 0, y: 0, z: 0 }, 100).onComplete(() => {
          star.geometry.dispose();
          star.material.dispose();
          scene.remove(star);
        }).start();
    }).start();
}

function randomPointOnASphere(radius) {
  const point = new THREE.Vector3();

  const randomDistance = Math.random() * radius + 8;
  const randomInclination = Math.random() * Math.PI;
  const randomAzimuth = Math.random() * 2 * Math.PI;

  point.setFromSphericalCoords(randomDistance, randomInclination, randomAzimuth);

  return point;
}



const raycaster = new THREE.Raycaster();
var selectedObject;
function onMouseMove(event) {

  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    if (selectedObject?.uuid != intersects[0].object.uuid) {

      if (selectedObject) selectedObject.material = new THREE.MeshToonMaterial({ color: 0xFF6300 });

      selectedObject = intersects[0].object;
      explodeStar(selectedObject)

    }
  } else if (selectedObject) {
    selectedObject = null;
  }
}

window.onmousemove = onMouseMove

window.onresize = onWindowResize;

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

//loop
function loop() {

  window.requestAnimationFrame(loop);

  controls.update();
  TWEEN.update();

  effect.render(scene, camera);
}

loop();
