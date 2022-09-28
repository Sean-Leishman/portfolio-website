import * as THREE from "three";
import * as TWEEN from "tween";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { BufferGeometryUtils } from "three";
("three/examples/jsm/utils/BufferGeometryUtils.js");
import HDR from "./assets/static/sepulchral_chapel_rotunda_2k.hdr";
import * as INIT_MODELS from "./init_models.js";
import update_boids from "./boids.js";
import Stats from "three/examples/jsm/libs/stats.module";

import * as FP from "fullpage.js";

import importedPawnModel from "./assets/models/chess.glb";
import importedHorseModel from "./assets/models/basic_horse.glb";
import importedMazeModel from "./assets/models/maze.glb";
import importedHeadModel from "./assets/models/head.glb";
import importedGraphModel from "./assets/models/sort_graph.glb";
import importedLogoModel from "./assets/models/Logo.glb";
import { MeshPhysicalMaterial, Vector3 } from "three";
import img from "./assets/images/drawing.png";
//const img = require('./assets/images/drawing.png');

const cursor = { x: 0, y: 0 };

let camera, scene, renderer, raycaster, frustum, loader, clock;
let pawnModel, pawnMixer, pawnAction, pawnAnimations;
let horseModel, horseMixer, horseAction, horseAnimations;
let mazeModel, mazeMixer, mazeAction, mazeAnimations;
let headModel, headMixer, headAction, headAnimations;
let graphModel, graphMixer, graphAction, graphAnimations;
let logoModel, logoMixer, logoAction, logoAnimations;
let canvas, parent;

let central_balls;
let stats;

let current_model, current_mixer, current_animations, current_action;
let previous_model, previous_mixer, previous_animations, previous_action;
let animated_model;

let previous_scroll_percent = 0;
let current_scroll_percent = 0;
let page_transition;
let previous_scroll_direction;
let scroll_direction; // -1 down, 1 up
let normal_scroll_direction;
let has_snapped = true;
let timer = null;

let isScrollEnabled = true;

let animation_main_state;
const ANIMATION_MAIN_STATE = {
  NORMAL: 0,
  UNSNAPPED: 1,
  SNAPPED: 2,
  STOPPED: 4,
  CONTINUE_SNAPPED: 5,
  CONTINUE_UNSNAPPED: 6,
};
let logo_main_state;
const LOGO_MAIN_STATE = {
  MIDDLE: 0,
  CORNER: 1,
};

let main_state;
const MAIN_STATE = {
  BALL_MODE: 0,
  MODEL_MODE: 1,
  BALL_TO_MODEL: 2,
  MODEL_TO_BALL: 3,
  MODEL_TO_MODEL: 4,
};

let ball_merge_main_state;
const BALL_MERGE_MAIN_STATE = {
  MERGE_IN_PROCESS: 0,
  MERGE_STAGE_DONE: 2,
  MERGE_FINISHED: 4,
  MERGE_START: 5,
  ANIMATION_WAIT: 6,
  INTERUPT_ANIMATION: 7,
};

let model_break_main_state;
const MODEL_BREAK_MAIN_STATE = {
  BREAK_START: 0,
  BREAK_IN_PROCESS: 1,
  BREAK_STAGE_DONE: 2,
  BREAK_FINISHED: 3,
  ANIMATION_WAIT: 4,
  INTERUPT_ANIMATION: 5,
};

let model_to_model_main_state;
const MODEL_TO_MODEL_MAIN_STATE = {
  BREAK: 0,
  MERGE: 1,
  FINISH: 2,
};

let scroll_main_state;
const SCROLL_MAIN_STATE = {
  UNSCROLLED: 0,
  SCROLLED: 1,
};

let model_main_state;
const MODEL_MAIN_STATE = {
  PAWN: 0,
  HORSE: 1,
  MAZE: 2,
  GRAPH: 3,
  HEAD: 4,
};
let previous_page;
let current_page = 0;
let total_pages = 6;
let page_transitions = {
  0: {
    1: [MAIN_STATE.BALL_TO_MODEL],
    2: [MAIN_STATE.BALL_TO_MODEL],
    3: [MAIN_STATE.BALL_TO_MODEL],
    4: [MAIN_STATE.BALL_TO_MODEL],
    1: [MAIN_STATE.BALL_TO_MODEL],
    5: [MAIN_STATE.BALL_TO_MODEL],
  },
  1: {
    0: [MAIN_STATE.MODEL_TO_BALL],
    1: [MAIN_STATE.MODEL_TO_MODEL],
    2: [MAIN_STATE.MODEL_TO_MODEL],
    3: [MAIN_STATE.MODEL_TO_MODEL],
    4: [MAIN_STATE.MODEL_TO_MODEL],
    5: [MAIN_STATE.MODEL_TO_MODEL],
  },
  2: {
    0: [MAIN_STATE.MODEL_TO_BALL],
    1: [MAIN_STATE.MODEL_TO_MODEL],
    2: [MAIN_STATE.MODEL_TO_MODEL],
    3: [MAIN_STATE.MODEL_TO_MODEL],
    4: [MAIN_STATE.MODEL_TO_MODEL],
    5: [MAIN_STATE.MODEL_TO_MODEL],
  },
  3: {
    0: [MAIN_STATE.MODEL_TO_BALL],
    1: [MAIN_STATE.MODEL_TO_MODEL],
    2: [MAIN_STATE.MODEL_TO_MODEL],
    3: [MAIN_STATE.MODEL_TO_MODEL],
    4: [MAIN_STATE.MODEL_TO_MODEL],
    5: [MAIN_STATE.MODEL_TO_MODEL],
  },
  4: {
    0: [MAIN_STATE.MODEL_TO_BALL],
    1: [MAIN_STATE.MODEL_TO_MODEL],
    2: [MAIN_STATE.MODEL_TO_MODEL],
    3: [MAIN_STATE.MODEL_TO_MODEL],
    4: [MAIN_STATE.MODEL_TO_MODEL],
    5: [MAIN_STATE.MODEL_TO_MODEL],
  },
  5: {
    0: [MAIN_STATE.MODEL_TO_BALL],
    1: [MAIN_STATE.MODEL_TO_MODEL],
    2: [MAIN_STATE.MODEL_TO_MODEL],
    3: [MAIN_STATE.MODEL_TO_MODEL],
    4: [MAIN_STATE.MODEL_TO_MODEL],
    5: [MAIN_STATE.MODEL_TO_MODEL],
  },
  6: { 5: [MAIN_STATE.BALL_TO_MODEL] },
};
let models;
let model_page = {
  1: MODEL_MAIN_STATE.PAWN,
  2: MODEL_MAIN_STATE.HORSE,
  3: MODEL_MAIN_STATE.MAZE,
  5: MODEL_MAIN_STATE.HEAD,
  4: MODEL_MAIN_STATE.GRAPH,
};
let scroll_page_levels = {};
for (let i = 0; i < total_pages; i++) {
  scroll_page_levels[i] = ((i + 1) / total_pages).toFixed(2);
}

let delta = 0;

let imgLogo;

let envmap;
let envmaploader;

let base_material;


async function init(hdrmap, hdrEquirect) {
  canvas = document.querySelector("canvas.webgl");
  parent = document.querySelector(".container");

  const manager = new THREE.LoadingManager();
  const loading_screen = document.getElementById('loading-screen');
  loading_screen.classList.add( 'fade-out' );
  loading_screen.addEventListener( 'transitionend', onTransitionEnd );
  // Per
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 250;

  frustum = new THREE.Frustum();
  frustum.setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
  );

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x212121);

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding;

  envmaploader = new THREE.PMREMGenerator(renderer);
  envmap = envmaploader.fromCubemap(hdrmap);

  const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 2);
  const spotLight = new THREE.SpotLight(0xffa05c, 2);
  spotLight.position.set(-200, 200, 200);
  spotLight.castShadow = true;

  scene.add(hemiLight);
  scene.add(spotLight);

  //scene.background = hdrEquirect;
  scene.environment = hdrEquirect;

  scene.number_of_spheres = 250;

  // Sphere to contain boids
  const contain_geometry = new THREE.BoxGeometry(500, 200, 200);
  const object = new THREE.Mesh(
    contain_geometry,
    new THREE.MeshBasicMaterial()
  );
  object.visible = false;
  object.position.z = 50;
  object.name = "Containment Box";
  scene.add(object);

  // Object for boids to avoid that contains title/logo
  const avoid_geometry = new THREE.BoxGeometry(300, 125, 100);
  const avoid_object = new THREE.Mesh(
    avoid_geometry,
    new THREE.MeshBasicMaterial()
  );
  avoid_object.visible = false;
  avoid_object.position.set(37, 38, 8);
  avoid_object.name = "Avoidance Box";
  scene.add(avoid_object);

  const geometry = new THREE.SphereGeometry(1, 32, 16);
  //const geometry = THREE.BufferGeometryUtils.fromGeometry(sphere);
  for (let i = 0; i < scene.number_of_spheres; i++) {
    generateBall(geometry);
  }

  base_material = new THREE.MeshPhysicalMaterial({
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    metalness: 0.9,
    roughness: 0.1,
    color: 0x8418ca,
    envMap: envmap.texture,
  });

  models = {
    0: pawnModel,
    1: horseModel,
    2: mazeModel,
    3: graphModel,
    4: headModel,
  };

  loader = new GLTFLoader( manager );
  // Load Model of Logo
  //[ pawnModel, pawnMixer, pawnAnimations, pawnAction ] = INIT_MODELS.init_pawnModel();
  loader.load(
    importedLogoModel,
    function(gltf) {
      logoModel = gltf.scene;

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xefd383,
        metalness: 0,
        roughness: 0,
        ior: 1.52,
        transmission: 1,
        specularIntensity: 1,
        specularColor: 0xffffff,
        opacity: 1,
        side: THREE.DoubleSide,
      });

      let p = logoModel.getObjectByName("rect453");
      //p.material = material;
      p.material = new THREE.MeshLambertMaterial({ color: 0xefd383 });
      logoModel.name = "Logo";
      logoModel.correct_scale = { x: 50, y: 50, z: 50 };
      logoModel.scale_ratio = { x: 1.83, y: 1.83, z: 1.83 };
      logoModel.correct_position = { x: 100, y: -80 };
      logoModel.scale.set(20, 20, 20);
      //logoModel.rotation.set(1.5708,0,0);
      logoModel.position.set(-50, -30, 0);
      logoModel.visible = false;
      logoModel.isModel = false;
      //scene.add(logoModel);
      //render();
      console.log(logoModel);
      //pawnMixer.addEventListener('finished', setNoScroll)
    },
    undefined,
    function(error) {
      console.error(error);
    }
  );

  // Load Model of Pawn
  //[ pawnModel, pawnMixer, pawnAnimations, pawnAction ] = INIT_MODELS.init_pawnModel();
  loader.load(
    importedPawnModel,
    function(gltf) {
      pawnModel = gltf.scene;
      pawnAnimations = gltf.animations;
      pawnMixer = new THREE.AnimationMixer(pawnModel);

      /* const material = new THREE.MeshPhysicalMaterial( {
            color: 0xefd383,
            metalness: 0,
            roughness: 0,
            ior: 1.52,
            transmission: 1,
            specularIntensity: 1,
            specularColor: 0xffffff,
            opacity: 1,
            side: THREE.DoubleSide,
            } ); */
      const material = base_material;

      let p = pawnModel.getObjectByName("Cylinder001");
      p.material = material;
      // Sphere to Pawn Animation
      pawnAction = pawnMixer.clipAction(pawnAnimations[1]);
      pawnAction.setLoop(THREE.LoopOnce);
      pawnAction.clampWhenFinished = true;
      p.geometry.computeVertexNormals();
      //pawnModel.children[0].material.emissive = new THREE.Color(0x00ffff);
      pawnModel.name = "Pawn";
      pawnModel.visible = true;
      pawnModel.correct_scale = { x: 50, y: 50, z: 50 };
      pawnModel.scale_ratio = { x: 1, y: 1, z: 1 };
      pawnModel.start_position = { x: 0, y: -1000, z: 0 };
      pawnModel.correct_position = { x: 140, y: -80 };
      pawnModel.loaded = true;
      pawnModel.scale.set(0, 0, 0);
      //pawnModel.position.set(0,-1000,0);
      pawnModel.isModel = true;
      scene.add(pawnModel);
      render();
      models[0] = pawnModel;
      //pawnMixer.addEventListener('finished', setNoScroll)
    },
    undefined,
    function(error) {
      console.error(error);
    }
  );

  // Load Model of Horse
  loader.load(
    importedHorseModel,
    function(gltf) {
      horseModel = gltf.scene;
      horseAnimations = gltf.animations;
      horseMixer = new THREE.AnimationMixer(horseModel);
      // Sphere to Pawn Animation
      horseAction = horseMixer.clipAction(horseAnimations[1]);
      horseAction.setLoop(THREE.LoopOnce);
      horseAction.clampWhenFinished = true;

      horseModel.rotation.y = -20;
      horseModel.correct_scale = { x: 1, y: 1, z: 1 };
      horseModel.scale_ratio = { x: 1, y: 1, z: 1 };
      horseModel.correct_position = { x: 140, y: -80 };
      //horseModel.position.set(0,-1000,0);
      horseModel.scale.set(0, 0, 0);
      let horseMesh = horseModel.getObjectByName("Mesh_0002");
      horseModel.originalMaterial = horseMesh.material;
      horseModel.loaded = true;
      //const colorKF = new THREE.ColorKeyframeTrack( '.material.color', [ 0, 1, 2 ], [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ], THREE.InterpolateDiscrete );

      //horseModel.children[0].material.emissive = new THREE.Color(0x00ffff);
      horseModel.name = "Horse";
      horseModel.visible = false;
      horseModel.isModel = true;
      scene.add(horseModel);
      models[1] = horseModel;
      //pawnMixer.addEventListener('finished', setNoScroll)
    },
    undefined,
    function(error) {
      console.error(error);
    }
  );

  loader.load(
    importedMazeModel,
    function(gltf) {
      mazeModel = gltf.scene;
      mazeAnimations = gltf.animations;
      mazeMixer = new THREE.AnimationMixer(mazeModel);

      const material = base_material;

      let p = mazeModel.getObjectByName("Cube");
      p.material = material;
      // Sphere to Pawn Animation
      mazeAction = mazeMixer.clipAction(mazeAnimations[1]);
      mazeAction.setLoop(THREE.LoopOnce);
      mazeAction.clampWhenFinished = true;
      p.geometry.computeVertexNormals();
      //pawnModel.children[0].material.emissive = new THREE.Color(0x00ffff);
      mazeModel.name = "Maze";
      mazeModel.visible = true;
      mazeModel.correct_scale = { x: 5/3, y: 5/3, z: 5/3 };
      mazeModel.scale_ratio = { x: 1, y: 1, z: 1 };
      mazeModel.correct_position = { x: 100, y: -50 };
      mazeModel.loaded = true;
      //mazeModel.position.set(0,-1000,0);
      mazeModel.scale.set(0, 0, 0);
      mazeModel.isModel = true;
      scene.add(mazeModel);
      render();
      models[2] = mazeModel;
      //pawnMixer.addEventListener('finished', setNoScroll)
    },
    undefined,
    function(error) {
      console.error(error);
    }
  );

  loader.load(
    importedHeadModel,
    function(gltf) {
      headModel = gltf.scene;
      headAnimations = gltf.animations;
      headMixer = new THREE.AnimationMixer(headModel);

      const material = new THREE.MeshLambertMaterial({
        color: 0xefd383,
        opacity: 1,
        side: THREE.DoubleSide,
      });

      let p = headModel.getObjectByName("Sphere004");
      p.material = material;
      // Sphere to Pawn Animation
      headAction = headMixer.clipAction(headAnimations[1]);
      headAction.setLoop(THREE.LoopOnce);
      headAction.clampWhenFinished = true;
      p.geometry.computeVertexNormals();
      //pawnModel.children[0].material.emissive = new THREE.Color(0x00ffff);
      headModel.name = "Head";
      headModel.visible = false;
      headModel.correct_scale = { x: 0, y: 0, z: 0 };
      headModel.scale_ratio = { x: 1, y: 1, z: 1 };
      headModel.correct_position = { x: 100, y: -50 };
      headModel.isModel = true;
      headModel.loaded = true;
      //headModel.position.set(0,-1000,0);
      headModel.scale.set(0, 0, 0);
      scene.add(headModel);
      render();
      models[4] = headModel;
      //pawnMixer.addEventListener('finished', setNoScroll)
    },
    undefined,
    function(error) {
      console.error(error);
    }
  );

  loader.load(
    importedGraphModel,
    function(gltf) {
      graphModel = gltf.scene;
      graphAnimations = gltf.animations;
      graphMixer = new THREE.AnimationMixer(graphModel);

      const material = base_material;

      let p = graphModel.getObjectByName("Cube");
      p.material = material;
      // Sphere to Pawn Animation
      graphAction = graphMixer.clipAction(graphAnimations[1]);
      graphAction.setLoop(THREE.LoopOnce);
      graphAction.clampWhenFinished = true;
      p.geometry.computeVertexNormals();
      //pawnModel.children[0].material.emissive = new THREE.Color(0x00ffff);
      graphModel.name = "Graph";
      graphModel.visible = false;
      graphModel.correct_scale = { x: 6.5, y: 6.5, z: 6.5 };
      graphModel.scale_ratio = { x: 1, y: 1, z: 1 };
      graphModel.correct_position = { x: 200, y: 0 };
      graphModel.rotation.set(0, -0.3, 0);
      graphModel.loaded = true;
      //graphModel.position.set(0,-1000,0)
      graphModel.scale.set(0, 0, 0);
      graphModel.isModel = true;
      scene.add(graphModel);
      render();
      models[3] = graphModel;
      //pawnMixer.addEventListener('finished', setNoScroll)
    },
    undefined,
    function(error) {
      console.error(error);
    }
  );

  main_state = MAIN_STATE.BALL_MODE;
  logo_main_state = LOGO_MAIN_STATE.MIDDLE;
  imgLogo = document.querySelector(".logo");
  imgLogo.src = img;

  window.addEventListener("resize", onResize);
  window.addEventListener("mousemove", onMouseMove);
  document.addEventListener("scroll", onScroll);

  console.log("Done init three.js", models, main_state);
}

async function animate() {
  //console.log("Animate")
  requestAnimationFrame(animate);

  update_current_model();
  update_previous_model();

  animate_camera_movement();

  //update_pages();
  switch (main_state) {
    case MAIN_STATE.BALL_MODE:
      //enable_scroll();
      animate_ball_motion(true);
      break;
    case MAIN_STATE.BALL_TO_MODEL:
      animate_ball_motion(false);
      switch (ball_merge_main_state) {
        case BALL_MERGE_MAIN_STATE.MERGE_FINISHED:
          if (has_snapped) {
            displayModel();
            has_snapped = false;
            //isScrollEnabled = true;
          } else {
            displayModel();
          }
          break;
        case BALL_MERGE_MAIN_STATE.MERGE_IN_PROCESS:
          if (
            scene.children
              .filter((val) => {
                return val.visible && val.name == "Sphere";
              })
              .every((val) => !val.closest_ball)
          ) {
            ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_STAGE_DONE;
          } else {
            merge();
            animate_ball_motion(false);
          }

          break;
        case BALL_MERGE_MAIN_STATE.MERGE_STAGE_DONE:
          if (
            scene.children.filter((val, idx, arr) => {
              return val.name == "Sphere" && val.visible;
            }).length == 1
          ) {
            ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_FINISHED;
          } else {
            initMerge();
            animate_ball_motion(false);
          }
          break;
        case BALL_MERGE_MAIN_STATE.MERGE_START:
          initMerge();
          break;
        case BALL_MERGE_MAIN_STATE.INTERUPT_ANIMATION:
          interupt_animation_for_merge();
          break;
      }
      break;
    case MAIN_STATE.MODEL_TO_BALL:
      switch (model_break_main_state) {
        case MODEL_BREAK_MAIN_STATE.BREAK_START:
          break_model();
          break;
        case MODEL_BREAK_MAIN_STATE.BREAK_IN_PROCESS:
          animate_ball_motion(false);
          if (has_snapped) {
            break_process();
          } else {
            break_process();
          }
          break;
        case MODEL_BREAK_MAIN_STATE.BREAK_FINISHED:
          main_state = MAIN_STATE.BALL_MODE;
          has_snapped = false;
          break;
        case MODEL_BREAK_MAIN_STATE.INTERUPT_ANIMATION:
          interupt_animation_for_break();
      }
      break;
    case MAIN_STATE.MODEL_TO_MODEL:
      animate_ball_motion(false);
      switch (model_to_model_main_state) {
        case MODEL_TO_MODEL_MAIN_STATE.BREAK:
          // MODEL_TO_BALL main_state
          switch (model_break_main_state) {
            case MODEL_BREAK_MAIN_STATE.BREAK_START:
              break_model();
              break;
            case MODEL_BREAK_MAIN_STATE.BREAK_IN_PROCESS:
              animate_ball_motion(false);
              break_process();
              break;
            case MODEL_BREAK_MAIN_STATE.BREAK_FINISHED:
              model_to_model_main_state = MODEL_TO_MODEL_MAIN_STATE.MERGE;
              ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_START;
              break;
            case MODEL_BREAK_MAIN_STATE.INTERUPT_ANIMATION:
              interupt_animation_for_break();
          }
          break;
        case MODEL_TO_MODEL_MAIN_STATE.MERGE:
          // BALL_TO_MODEL main_state
          switch (ball_merge_main_state) {
            case BALL_MERGE_MAIN_STATE.MERGE_FINISHED:
              if (has_snapped) {
                displayModel();
                has_snapped = false;
              } else {
                displayModel();
              }
              break;
            case BALL_MERGE_MAIN_STATE.MERGE_IN_PROCESS:
              if (
                scene.children
                  .filter((val) => {
                    return val.visible && val.name == "Sphere";
                  })
                  .every((val) => !val.closest_ball)
              ) {
                ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_STAGE_DONE;
              } else {
                merge();
                animate_ball_motion(false);
              }

              break;
            case BALL_MERGE_MAIN_STATE.MERGE_STAGE_DONE:
              if (
                scene.children.filter((val, idx, arr) => {
                  return val.name == "Sphere" && val.visible;
                }).length == 1
              ) {
                ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_FINISHED;
              } else {
                initMerge();
                animate_ball_motion(false);
              }
              break;
            case BALL_MERGE_MAIN_STATE.MERGE_START:
              initMerge();
              break;
            case BALL_MERGE_MAIN_STATE.INTERUPT_ANIMATION:
              interupt_animation_for_merge();
              break;
          }
          break;
      }
    case MAIN_STATE.MODEL_MODE:
      animate_ball_motion(false);
  }

  TWEEN.update();
  delta = clock.getDelta();
  if (current_mixer) {
    current_mixer.update(delta);
  }
  render();
}
function render() {
  renderer.render(scene, camera);
  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  if (canvas.clientWidth < 700){
    scene.toDisplay = false;
  }
  else{
    scene.toDisplay = true;
  }
}

function animate_ball_motion(is_boid_mode) {
  frustum.setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
  );
  if (is_boid_mode)
    update_boids(
      scene,
      scene.children.filter((child) => {
        return child.name == "Sphere" && child.visible;
      })
    );
  scene.children.forEach((child) => {
    if (child.name == "Sphere" && child.visible) {
      child.position.x = child.position.x + child.velocity.x;
      child.position.y = child.position.y + child.velocity.y;
      if (child.position.z > -400 || is_boid_mode) {
        child.position.z = child.position.z + child.velocity.z;
      }

      // Checks sphere is in view
      if (!frustum.containsPoint(child.position)) {
        child.velocity.x = child.velocity.x * -1;
        child.velocity.y = child.velocity.y * -1;
      }
    }
  });
}

function break_model() {
  [
    previous_model,
    previous_mixer,
    previous_animations,
    previous_action,
  ] = get_previous_model_details(previous_model); // Get model corresponding to page

  previous_mixer.removeEventListener("finished", animation_finished);

  previous_action = current_mixer.clipAction(previous_animations[1]);
  previous_action.setLoop(THREE.LoopOnce);
  previous_action.paused = false;
  previous_action.timeScale = -3;
  previous_action.play();

  model_break_main_state = MODEL_BREAK_MAIN_STATE.ANIMATION_WAIT;
  animated_model = {
    model: previous_model,
    mixer: previous_mixer,
    action: previous_action,
  };
  previous_mixer.addEventListener("finished", reverse_animation_finished);

  if (scroll_direction == -1) {
    new TWEEN.Tween(previous_model.position).to({ y: -1000 }, 1000).start();
  }
  if (scroll_direction == 1) {
    new TWEEN.Tween(previous_model.position).to({ y: 1000 }, 1000).start();
  }
  model_break_main_state = MODEL_BREAK_MAIN_STATE.BREAK_IN_PROCESS;
}

function break_process() {
  model_break_main_state = MODEL_BREAK_MAIN_STATE.BREAK_FINISHED;
}

function reverse_animation_finished() {
  /*animated_model.model.visible = false;
    animated_model.model.ball.position.x = animated_model.model.position.x;
    animated_model.model.ball.position.y = animated_model.model.position.y;
    animated_model.model.ball.scale.x = animated_model.model.scale.x;
    animated_model.model.ball.scale.y = animated_model.model.scale.x;
    animated_model.model.ball.scale.z = animated_model.model.scale.x;
    animated_model.model.ball.visible = false;
    animated_model.mixer.stopAllAction();*/
  //model_break_main_state = MODEL_BREAK_MAIN_STATE.BREAK_IN_PROCESS;
  animated_model.model.visible = false;
}
function initMerge() {
  let balls = scene.children.filter((val, idx, arr) => {
    return val.name == "Sphere" && val.visible;
  });
  balls.forEach((ball) => {
    ball.velocity.set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 1
    );
  });
  ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_FINISHED;
}
function displayModel() {
  if (!scene.toDisplay){
    return;
  }
  [
    current_model,
    current_mixer,
    current_animations,
    current_action,
  ] = get_current_model_details(current_model);
  console.log("current model", current_model, models);
  if (!current_model){
    return;
  }
  current_mixer.removeEventListener("finished", reverse_animation_finished);
  let center_ball = scene.children.filter((val) => {
    return val.visible && val.isModel;
  })[0];
  if (!center_ball) {
    center_ball = scene.children.filter((val) => {
      return val.visible && val.name == "Sphere";
    })[0];
    center_ball.visible = false;

    current_model.ball = center_ball;
    current_model.position.x = center_ball.position.x;
    current_model.position.y = center_ball.position.y;
    current_model.scale.x = center_ball.scale.x / current_model.scale_ratio.x;
    current_model.scale.y = center_ball.scale.y / current_model.scale_ratio.y;
    current_model.scale.z = center_ball.scale.z / current_model.scale_ratio.z;

    new TWEEN.Tween(current_model.position)
      .to({
        x: current_model.correct_position.x,
        y: current_model.correct_position.y,
      })
      .start();
    new TWEEN.Tween(current_model.scale)
      .to({
        x: current_model.correct_scale.x,
        y: current_model.correct_scale.x,
        z: current_model.correct_scale.x,
      })
      .start();

    current_action.timeScale = 1;
    current_action.paused = false;
    current_model.visible = true;
    current_action.play();
  } else {
    current_action.timeScale = 1;
    current_action.paused = false;
    current_model.visible = true;
    current_action.play();

    current_model.scale.x =
      current_model.correct_scale.x / current_model.scale_ratio.x;
    current_model.scale.y =
      current_model.correct_scale.y / current_model.scale_ratio.y;
    current_model.scale.z =
      current_model.correct_scale.z / current_model.scale_ratio.z;

    if (scroll_direction == 1) {
      current_model.position.set(current_model.correct_position.x, -1000, 0);
      new TWEEN.Tween(current_model.position)
        .to({ y: current_model.correct_position.y })
        .start();
    } else if (scroll_direction == -1) {
      current_model.position.set(current_model.correct_position.x, 1000, 0);
      new TWEEN.Tween(current_model.position)
        .to({ y: current_model.correct_position.y })
        .start();
    }
  }

  // TODO
  // Change for when have to be able to reverse midanimation
  ball_merge_main_state = BALL_MERGE_MAIN_STATE.ANIMATION_WAIT;
  animated_model = {
    model: current_model,
    mixer: current_mixer,
    action: current_action,
  };
  current_mixer.addEventListener("finished", animation_finished);
  ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_START;
  main_state = MAIN_STATE.MODEL_MODE;
}

function animation_finished() {
  //ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_START;
  //main_state = MAIN_STATE.MODEL_MODE;
  enable_scroll();
}

let fixing = false;
scroll_main_state = SCROLL_MAIN_STATE.UNSCROLLED;
function onScroll() {
  previous_scroll_percent = current_scroll_percent;
  current_scroll_percent = _get_scroll_percentage();
  update_pages();
  if (!isScrollEnabled) {
    disable_scroll();
    return;
  }
  console.log("scrolling", current_scroll_percent);
  //scroll_main_state = SCROLL_MAIN_STATE.HALF_SCROLLED;
  determine_scroll_direction();
  //console.log(scroll_main_state,animation_main_state,main_state,scroll_direction,previous_scroll_percent,current_scroll_percent)
  if (animation_main_state == ANIMATION_MAIN_STATE.NORMAL) {
    fixing = false;
    switch (main_state) {
      // Start of Scroll
      case MAIN_STATE.BALL_MODE:
        main_state =
          page_transitions[current_page][current_page + scroll_direction][0];
        if (main_state == MAIN_STATE.BALL_TO_MODEL) {
          ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_START;
        }
        if (current_page == 0 && logo_main_state == LOGO_MAIN_STATE.MIDDLE) {
          logo_main_state = LOGO_MAIN_STATE.CORNER;
          //animate_logo(true);
        }
        break;
      case MAIN_STATE.MODEL_MODE:
        main_state =
          page_transitions[current_page][current_page + scroll_direction][0];
        if (main_state == MAIN_STATE.MODEL_TO_MODEL) {
          model_to_model_main_state = MODEL_TO_MODEL_MAIN_STATE.BREAK;
          model_break_main_state = MODEL_BREAK_MAIN_STATE.BREAK_START;
        }
        if (main_state == MAIN_STATE.MODEL_TO_BALL) {
          model_break_main_state = MODEL_BREAK_MAIN_STATE.BREAK_START;
          if (current_page == 1 && logo_main_state == LOGO_MAIN_STATE.CORNER) {
            logo_main_state = LOGO_MAIN_STATE.MIDDLE;
            //animate_logo(false);
          }
        }
        break;
    }
    console.log("Normal Main_state");
  }
  previous_scroll_direction = scroll_direction;
}

function onLeave(origin, destination, direction, trigger) {
  console.log("onleave called");
  models = {
    0: pawnModel,
    1: horseModel,
    2: mazeModel,
    3: graphModel,
    4: headModel,
  };
  normal_scroll_direction = direction == "up" ? 1 : -1;
  scroll_direction = direction == "up" ? 1 : -1;
  current_page = destination.index;
  previous_page = origin.index;
  console.log("scroll_direction",scroll_direction, direction)
  update_current_model();
  update_previous_model();
  console.log("main_state",MAIN_STATE[main_state],main_state)
  console.log("current page, prev page,  page transitions",current_page,previous_page, page_transitions[previous_page][current_page])
  switch (main_state) {
    // Start of Scroll
    case MAIN_STATE.BALL_MODE:
      main_state = page_transitions[previous_page][current_page][0];
      if (main_state == MAIN_STATE.BALL_TO_MODEL) {
        ball_merge_main_state = BALL_MERGE_MAIN_STATE.MERGE_START;
      }
      if (
        previous_page == 0 &&
        current_page == 1 &&
        logo_main_state == LOGO_MAIN_STATE.MIDDLE
      ) {
        logo_main_state = LOGO_MAIN_STATE.CORNER;
        //animate_logo(true);
      }
      break;
    case MAIN_STATE.MODEL_MODE:
      main_state = page_transitions[previous_page][current_page][0];
      if (main_state == MAIN_STATE.MODEL_TO_MODEL) {
        model_to_model_main_state = MODEL_TO_MODEL_MAIN_STATE.BREAK;
        model_break_main_state = MODEL_BREAK_MAIN_STATE.BREAK_START;
      }
      if (main_state == MAIN_STATE.MODEL_TO_BALL) {
        model_break_main_state = MODEL_BREAK_MAIN_STATE.BREAK_START;
        if (
          previous_page == 1 &&
          current_page == 0 &&
          logo_main_state == LOGO_MAIN_STATE.CORNER
        ) {
          logo_main_state = LOGO_MAIN_STATE.MIDDLE;
          //animate_logo(false);
        }
      }
      break;
  }
  disable_scroll();
  let next_models = get_next_models();
  next_models.forEach((model) => {
    if (model) {
      if (!model.loaded) {
        model.visible = true;
        model.scale.set(0, 0, 0);
        model.loaded = true;
      }
    }
  });
  console.log("onleave done");
}

function onMouseMove(event) {
  cursor.x = event.clientX / window.innerWidth - 0.5;
  cursor.y = event.clientY / window.innerHeight - 0.5;
}

function animate_camera_movement() {
  //camera.position.y = - scrollY / window.innerHeight * objectsDistance

  const parallaxX = -cursor.x * 10;
  const parallaxY = -cursor.y * 10;
  camera.position.x += (parallaxX - camera.position.x) * 5 * delta;
  camera.position.y += (parallaxY - camera.position.y) * 5 * delta;
}
function determine_scroll_direction() {
  // Scolling Down
  if (current_scroll_percent > previous_scroll_percent) {
    if (
      main_state == MAIN_STATE.MODEL_MODE ||
      main_state == MAIN_STATE.BALL_MODE
    ) {
      animation_main_state = ANIMATION_MAIN_STATE.NORMAL;
      has_snapped = false;
      normal_scroll_direction = -1;
    }
    // Opposite scroll while page not snapped
    else if (normal_scroll_direction == 1 && !has_snapped) {
      animation_main_state = ANIMATION_MAIN_STATE.UNSNAPPED;
      normal_scroll_direction = -1;
      fixing = true;
    }
    // Opposite Scroll but the page has snapped but animation is not finished (not in ball/model mode)
    else if (normal_scroll_direction == 1 && has_snapped) {
      animation_main_state = ANIMATION_MAIN_STATE.SNAPPED;
      normal_scroll_direction = -1;
      has_snapped = false;
      fixing = true;
    } else {
      animation_main_state = ANIMATION_MAIN_STATE.STOPPED;
    }
    scroll_direction = 1;
  }
  // Scroll Up
  if (previous_scroll_percent > current_scroll_percent) {
    // Page Snapped and Animations finished
    if (
      main_state == MAIN_STATE.MODEL_MODE ||
      main_state == MAIN_STATE.BALL_MODE
    ) {
      animation_main_state = ANIMATION_MAIN_STATE.NORMAL;
      has_snapped = false;
      normal_scroll_direction = 1;
    }
    // Opposite scroll while page not snapped
    else if (normal_scroll_direction == -1 && !has_snapped) {
      animation_main_state = ANIMATION_MAIN_STATE.UNSNAPPED;
      normal_scroll_direction = 1;
    }
    // Opposite Scroll but the page has snapped but animation is not finished (not in ball/model mode)
    else if (normal_scroll_direction == -1 && has_snapped) {
      animation_main_state = ANIMATION_MAIN_STATE.SNAPPED;
      normal_scroll_direction = 1;
    } else {
      animation_main_state = ANIMATION_MAIN_STATE.STOPPED;
    }

    scroll_direction = -1;
  }
  if (previous_scroll_direction != scroll_direction) {
    fixing = true;
  }
  previous_scroll_direction = scroll_direction;
}

function update_pages() {
  const margin = 2;
  if (
    current_page - 1 >= 0 &&
    scroll_page_levels[current_page - 1] >
      ((current_scroll_percent - margin) / 100).toFixed(2) &&
    scroll_page_levels[current_page - 1] <
      ((current_scroll_percent + margin) / 100).toFixed(2)
  ) {
    console.log("scroll-up page swap");
    has_snapped = true;
    previous_page = current_page;
    current_page--;
  }

  if (
    current_page + 1 < Object.keys(scroll_page_levels).length &&
    scroll_page_levels[current_page + 1] >
      ((current_scroll_percent - margin) / 100).toFixed(2) &&
    scroll_page_levels[current_page + 1] <
      ((current_scroll_percent + margin) / 100).toFixed(2)
  ) {
    console.log("scroll-down page swap");
    has_snapped = true;
    previous_page = current_page;
    current_page++;
  }

  if (
    normal_scroll_direction == 1 &&
    previous_scroll_percent > current_scroll_percent &&
    has_snapped
  ) {
    isScrollEnabled = false;
    console.log("scroll_disabled");
  }
  if (
    normal_scroll_direction == -1 &&
    previous_scroll_percent < current_scroll_percent &&
    has_snapped
  ) {
    isScrollEnabled = false;
    console.log("scroll_disabled");
  }
}

function onResize() {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function generateBall(geometry) {
  const material = {
    color: 0x8418ca,
  };
  const object = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial(
      //{ color: Math.random() * 0xffffff }
      material
    )
  );
  object.scale.set(1, 1, 1);
  object.position.x = Math.random() * 300 - 150;
  object.position.y = Math.random() * 300 - 150;
  object.position.z = Math.random() * 300 - 150;

  object.original_scale = {
    x: object.scale.x,
    y: object.scale.y,
    z: object.scale.z,
  };

  object.name = "Sphere";
  object.velocity = new THREE.Vector3(
    2 * (Math.random() - 0.5),
    2 * (Math.random() - 0.5),
    2 * (Math.random() - 0.5)
  );
  object.ballsHeld = [];

  scene.add(object);

  return object;
}

function animate_logo(minimize) {
  if (minimize) {
    let pos = convert_coord_to_position(new Vector3(100, 100, 0));
    new TWEEN.Tween(logoModel.position)
      .to({ x: pos.x, y: pos.y, z: 0 }, 1000)
      .start();
    new TWEEN.Tween(logoModel.scale).to({ x: 5, y: 5, z: 5 }, 1000).start();
    new TWEEN.Tween(logoModel.rotation).to({ x: 0.47, y: 0.4, z: 0 }).start();
    //new TWEEN.Tween(logoModel.rotation).to(dir_to_camera).start();
    logoModel.lookAt(camera.position);
  } else {
    new TWEEN.Tween(logoModel.position).to({ x: -50, y: -30, z: 0 }).start();
    new TWEEN.Tween(logoModel.scale).to({ x: 20, y: 20, z: 20 }).start();
    new TWEEN.Tween(logoModel.rotation).to({ x: 0, y: 0, z: 0 }).start();
    logoModel.lookAt(camera.position);
  }
  console.log(logoModel.position);
  console.log(convert_position_to_coord(logoModel.position));
  console.log(
    convert_coord_to_position(convert_position_to_coord(logoModel.position))
  );
}
function update_current_model() {
  current_model = models[model_page[current_page]];
  //current_model = models[model_page[previous_page]];
}
function update_previous_model() {
  previous_model = models[model_page[previous_page]];
}

function get_next_models() {
  return [
    models[model_page[current_page + 1]],
    models[model_page[current_page - 1]],
  ];
}

function convert_position_to_coord(vector) {
  let copy_vector = vector.clone();
  copy_vector.project(camera);
  copy_vector.x = ((copy_vector.x + 1) * window.innerWidth) / 2;
  copy_vector.y = (-(copy_vector.y - 1) * window.innerHeight) / 2;
  copy_vector.z = 0;
  return copy_vector;
}

function convert_coord_to_position(vector) {
  let copy_vector = vector.clone();
  let pos = new THREE.Vector3();

  copy_vector.x = (copy_vector.x / window.innerWidth) * 2 - 1;
  copy_vector.y = -(copy_vector.y / window.innerHeight) * 2 + 1;
  copy_vector.z = 0.5;
  copy_vector.unproject(camera);
  copy_vector.sub(camera.position).normalize;

  let dist = -camera.position.z / copy_vector.z;
  pos.copy(camera.position).add(copy_vector.multiplyScalar(dist));

  //frustum.containsPoint
  return pos;
}

function get_corners_x_y(z) {
  //for
}
function get_current_model_details() {
  if (current_model == pawnModel) {
    return [pawnModel, pawnMixer, pawnAnimations, pawnAction];
  } else if (current_model == horseModel) {
    return [horseModel, horseMixer, horseAnimations, horseAction];
  } else if (current_model == mazeModel) {
    return [mazeModel, mazeMixer, mazeAnimations, mazeAction];
  } else if (current_model == headModel) {
    return [headModel, headMixer, headAnimations, headAction];
  } else if (current_model == graphModel) {
    return [graphModel, graphMixer, graphAnimations, graphAction];
  }
  return [undefined, undefined, undefined, undefined]
}

function get_previous_model_details() {
  if (previous_model == pawnModel) {
    return [pawnModel, pawnMixer, pawnAnimations, pawnAction];
  } else if (previous_model == horseModel) {
    return [horseModel, horseMixer, horseAnimations, horseAction];
  } else if (previous_model == mazeModel) {
    return [mazeModel, mazeMixer, mazeAnimations, mazeAction];
  } else if (previous_model == headModel) {
    return [headModel, headMixer, headAnimations, headAction];
  } else if (previous_model == graphModel) {
    return [graphModel, graphMixer, graphAnimations, graphAction];
  }
}

function closest_central_point(target, origins) {
  let distances = new Array(origins.length);
  distances = origins.map((origin) => {
    return euclidean_distance(origin, target);
  });
  return origins[distances.indexOf(Math.min(...distances))];
}

function euclidean_distance(a, b) {
  return Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
}

function velocity_between_points(origin, target) {
  return {
    x: target.position.x - origin.position.x,
    y: target.position.y - origin.position.y,
    z: target.position.z - origin.position.z,
  };
}

/**
 * Get current browser viewpane heigtht
 */
function _get_window_height() {
  return (
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight ||
    0
  );
}

/**
 * Get current absolute window scroll position
 */
function _get_window_Yscroll() {
  return (
    window.pageYOffset ||
    document.body.scrollTop ||
    document.documentElement.scrollTop ||
    parent.scrollTop ||
    0
  );
}

/**
 * Get current absolute document height
 */
function _get_doc_height() {
  return Math.max(
    document.body.scrollHeight || 0,
    document.documentElement.scrollHeight || 0,
    document.body.offsetHeight || 0,
    document.documentElement.offsetHeight || 0,
    document.body.clientHeight || 0,
    document.documentElement.clientHeight || 0,
    parent.scrollHeight || 0
  );
}

/**
 * Get current vertical scroll percentage
 */
function _get_scroll_percentage() {
  return (
    ((_get_window_Yscroll() + _get_window_height()) / _get_doc_height()) * 100
  );
}
function disable_scroll() {
  // Get the current page scroll position
  let scrollTop =
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    parent.scrollTop;
  let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  parent.classList.add("disable-scroll");
  parent.scrollTo(scrollLeft, scrollTop);
  console.log("Disbale scroll");
}

function enable_scroll() {
  parent.classList.remove("disable-scroll");
  isScrollEnabled = true;
  console.log("Enable Scroll");
}

function onTransitionEnd( event ) {

	event.target.remove();
	
}

export {init, animate, onLeave};