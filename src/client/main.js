import * as THREE from 'three';
import * as TWEEN from 'tween';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader';
import HDR from './assets/static/sepulchral_chapel_rotunda_2k.hdr';
import  * as INIT_MODELS from './init_models.js';
import update_boids from './boids.js';
import Stats from 'three/examples/jsm/libs/stats.module'

import importedPawnModel from './assets/models/chess.glb';
import importedHorseModel from './assets/models/basic_horse.glb';
import importedMazeModel from './assets/models/maze.glb';
import importedHeadModel from './assets/models/head.glb';
import importedGraphModel from './assets/models/sort_graph.glb';
import importedLogoModel from './assets/models/Logo.glb';
import { MeshPhysicalMaterial } from 'three';

let camera, scene, renderer, raycaster, frustum,loader,clock;
let pawnModel,pawnMixer,pawnAction,pawnAnimations;
let horseModel,horseMixer,horseAction, horseAnimations;
let mazeModel,mazeMixer,mazeAction, mazeAnimations;
let headModel,headMixer,headAction, headAnimations;
let graphModel,graphMixer,graphAction, graphAnimations;
let logoModel, logoMixer, logoAction, logoAnimations;
let canvas, parent;

let central_balls;
let stats;

let current_model,current_mixer,current_animations,current_action;
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

let animation_state;
const ANIMATION_STATE = {
    NORMAL: 0,
    UNSNAPPED: 1,
    SNAPPED: 2,
    STOPPED: 4,
    CONTINUE_SNAPPED: 5,
    CONTINUE_UNSNAPPED:6
}
let logo_state;
const LOGO_STATE = {
    MIDDLE: 0,
    CORNER: 1
}

let state;
const STATE = {
    BALL_MODE: 0,
    MODEL_MODE: 1,
    BALL_TO_MODEL: 2,
    MODEL_TO_BALL: 3,
    MODEL_TO_MODEL: 4
}

let ball_merge_state;
const BALL_MERGE_STATE = {
    MERGE_IN_PROCESS: 0,
    MERGE_STAGE_DONE: 2,
    MERGE_FINISHED: 4,
    MERGE_START: 5,
    ANIMATION_WAIT: 6,
    INTERUPT_ANIMATION: 7
}

let model_break_state;
const MODEL_BREAK_STATE = {
    BREAK_START: 0,
    BREAK_IN_PROCESS: 1,
    BREAK_STAGE_DONE: 2,
    BREAK_FINISHED: 3,
    ANIMATION_WAIT: 4,
    INTERUPT_ANIMATION: 5
}

let model_to_model_state;
const MODEL_TO_MODEL_STATE = {
    BREAK: 0,
    MERGE: 1,
    FINISH: 2
}

let scroll_state;
const SCROLL_STATE = {
    UNSCROLLED: 0,
    SCROLLED: 1
}

let model_state;
const MODEL_STATE = {
    PAWN: 0,
    HORSE: 1,
    MAZE:2,
    GRAPH: 3,
    HEAD: 4
}
let previous_page;
let current_page = 0;
let total_pages = 6;
let page_transitions = {0: {1:[STATE.BALL_TO_MODEL]}, 
                        1: {0:[STATE.MODEL_TO_BALL],2:[STATE.MODEL_TO_MODEL]}, 
                        2: {1: [STATE.MODEL_TO_MODEL], 3:[STATE.MODEL_TO_MODEL]},
                        3: {2: [STATE.MODEL_TO_MODEL], 4: [STATE.MODEL_TO_MODEL]},
                        4: {3: [STATE.MODEL_TO_MODEL], 5: [STATE.MODEL_TO_MODEL]},
                        5: {4: [STATE.MODEL_TO_MODEL], 6: [STATE.MODEL_TO_BALL]},
                        6: {5: [STATE.BALL_TO_MODEL]},
                    }
let models;
let model_page = {1: MODEL_STATE.PAWN, 2:MODEL_STATE.HORSE, 3:MODEL_STATE.MAZE, 5: MODEL_STATE.HEAD,
                    4: MODEL_STATE.GRAPH};
let scroll_page_levels = {}
for (let i = 0; i < total_pages; i++){
    scroll_page_levels[i] = ((i + 1)/total_pages).toFixed(2);
}

let envmap;
let envmaploader;
const hdrEquirect = new RGBELoader()
  .load( HDR, function (hdrmap) {

    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;

    init();
    envmaploader = new THREE.PMREMGenerator(renderer);
    envmap = envmaploader.fromCubemap(hdrmap)
    animate();
    render();

  } );

//init();
//animate();

function init(){
    canvas = document.querySelector('canvas.webgl')
    parent = document.getElementsByClassName('container')[0]

    // Per
    camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight,1,10000);
    camera.position.z = 250

    frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();

    const axesHelper = new THREE.AxesHelper( 100 );
    scene.add( axesHelper );

    renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true, antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearAlpha(0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;

    const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 2);
    const spotLight = new THREE.SpotLight(0xffa05c,2);
    spotLight.position.set(-200,200,200);
    spotLight.castShadow = true;

    scene.add(hemiLight)
    scene.add(spotLight);

    //scene.background = hdrEquirect;
    scene.environment = hdrEquirect;
  

    scene.number_of_spheres = 500;

    // Sphere to contain boids
    const contain_geometry = new THREE.BoxGeometry( 500,200,200 );
    const object = new THREE.Mesh( contain_geometry, new THREE.MeshBasicMaterial() );
    object.visible = false;
    object.position.z = 50;
    object.name = 'Containment Box'
    scene.add(object);

    // Object for boids to avoid that contains title/logo
    const avoid_geometry = new THREE.BoxGeometry( 300,125,100 );
    const avoid_object = new THREE.Mesh( avoid_geometry, new THREE.MeshBasicMaterial() );
    avoid_object.visible = false;
    avoid_object.position.set(37,38,8)
    avoid_object.name = 'Avoidance Box'
    scene.add(avoid_object); 

    const geometry = new THREE.SphereGeometry( 1, 32, 16 );
    for ( let i = 0; i < scene.number_of_spheres; i ++ ) {
        generateBall(geometry)
    }
    loader = new GLTFLoader();
    // Load Model of Logo 
    //[ pawnModel, pawnMixer, pawnAnimations, pawnAction ] = INIT_MODELS.init_pawnModel();
    loader.load(importedLogoModel, function(gltf) {
        logoModel = gltf.scene;

        const material = new THREE.MeshPhysicalMaterial( {
            color: 0xefd383,
            metalness: 0,
            roughness: 0,
            ior: 1.52,
            transmission: 1,
            specularIntensity: 1,
            specularColor: 0xffffff,
            opacity: 1,
            side: THREE.DoubleSide,
            } );

        let p = logoModel.getObjectByName('rect453');
        //p.material = material;
        p.material = new THREE.MeshLambertMaterial({color: 0xefd383})
        logoModel.name = "Logo";
        logoModel.correct_scale = {x:50, y:50, z:50}
        logoModel.scale_ratio = {x:1.83, y:1.83, z:1.83}
        logoModel.correct_position = {x: 100,y:-80};
        logoModel.scale.set(20,20,20);
        logoModel.rotation.set(1.5708,0,0);
        logoModel.position.set(-50,-30,0)
        logoModel.visible = true;
        logoModel.isModel = false;
        scene.add(logoModel);
        render()
        console.log(logoModel)
        //pawnMixer.addEventListener('finished', setNoScroll)
    }, undefined, function(error) {
        console.error(error);
    });

    // Load Model of Pawn 
    //[ pawnModel, pawnMixer, pawnAnimations, pawnAction ] = INIT_MODELS.init_pawnModel();
    loader.load(importedPawnModel, function(gltf) {
        pawnModel = gltf.scene;
        pawnAnimations = gltf.animations;
        pawnMixer = new THREE.AnimationMixer(pawnModel);

        const material = new THREE.MeshPhysicalMaterial( {
            color: 0xefd383,
            metalness: 0,
            roughness: 0,
            ior: 1.52,
            transmission: 1,
            specularIntensity: 1,
            specularColor: 0xffffff,
            opacity: 1,
            side: THREE.DoubleSide,
            } );

        let p = pawnModel.getObjectByName('Cylinder001');
        p.material = material;
        // Sphere to Pawn Animation
        pawnAction = pawnMixer.clipAction( pawnAnimations[1] );
        pawnAction.setLoop(THREE.LoopOnce);
        pawnAction.clampWhenFinished = true;
        p.geometry.computeVertexNormals();
        //pawnModel.children[0].material.emissive = new THREE.Color(0x00ffff);
        pawnModel.name = "Pawn";
        pawnModel.visible = false;
        pawnModel.correct_scale = {x:50, y:50, z:50}
        pawnModel.scale_ratio = {x:1.83, y:1.83, z:1.83}
        pawnModel.correct_position = {x: 140,y:-80};
        pawnModel.isModel = true;
        scene.add(pawnModel);
        render()
        //pawnMixer.addEventListener('finished', setNoScroll)
    }, undefined, function(error) {
        console.error(error);
    });

    // Load Model of Horse
    loader.load(importedHorseModel, function(gltf) {
        horseModel = gltf.scene;
        horseAnimations = gltf.animations;
        horseMixer = new THREE.AnimationMixer(horseModel);
        // Sphere to Pawn Animation
        horseAction = horseMixer.clipAction( horseAnimations[1] );
        horseAction.setLoop(THREE.LoopOnce);
        horseAction.clampWhenFinished = true;
        
        horseModel.rotation.y = -20;
        horseModel.correct_scale = {x:0.8, y:0.8, z:0.8}
        horseModel.scale_ratio = {x: 60, y: 60, z: 60}
        horseModel.correct_position = {x: 140,y:-80};

        let horseMesh = horseModel.getObjectByName('Mesh_0002');
        horseModel.originalMaterial = horseMesh.material;
        horseMesh.material.color.r = 256;
        horseMesh.material.color.g = 256;
        horseMesh.material.color.b = 256;

        //const colorKF = new THREE.ColorKeyframeTrack( '.material.color', [ 0, 1, 2 ], [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ], THREE.InterpolateDiscrete );


        //horseModel.children[0].material.emissive = new THREE.Color(0x00ffff);
        horseModel.name = "Horse";
        horseModel.visible = false;
        horseModel.isModel = true;
        scene.add(horseModel);
        //pawnMixer.addEventListener('finished', setNoScroll)
    }, undefined, function(error) {
        console.error(error);
    });

    loader.load(importedMazeModel, function(gltf) {
        mazeModel = gltf.scene;
        mazeAnimations = gltf.animations;
        mazeMixer = new THREE.AnimationMixer(mazeModel);

        const material = new THREE.MeshPhysicalMaterial( {
            clearcoat: 1.0,
            cleacoatRoughness: 0.1,
            metalness: 0.9,
            roughness: 0.1,
            color: 0x8418ca,
            envmap: envmap,
          } );

        let p = mazeModel.getObjectByName('Cube');
        p.material = material;
        // Sphere to Pawn Animation
        mazeAction = mazeMixer.clipAction( mazeAnimations[1] );
        mazeAction.setLoop(THREE.LoopOnce);
        mazeAction.clampWhenFinished = true;
        p.geometry.computeVertexNormals();
        //pawnModel.children[0].material.emissive = new THREE.Color(0x00ffff);
        mazeModel.name = "Maze";
        mazeModel.visible = false;
        mazeModel.correct_scale = {x:2, y:2, z:2}
        mazeModel.scale_ratio = {x:61.7, y:61.7, z:61.7}
        mazeModel.correct_position = {x: 100,y:-50};
        mazeModel.isModel = true;
        scene.add(mazeModel);
        render()
        //pawnMixer.addEventListener('finished', setNoScroll)
    }, undefined, function(error) {
        console.error(error);
    });

    loader.load(importedHeadModel, function(gltf) {
        headModel = gltf.scene;
        headAnimations = gltf.animations;
        headMixer = new THREE.AnimationMixer(headModel);

        const material = new THREE.MeshLambertMaterial( {
            color: 0xefd383,
            metalness: 0,
            roughness: 0,
            ior: 1.52,
            transmission: 1,
            specularIntensity: 1,
            specularColor: 0xffffff,
            opacity: 1,
            side: THREE.DoubleSide,
          } );

        let p = headModel.getObjectByName('Sphere004');
        p.material = material;
        // Sphere to Pawn Animation
        headAction = headMixer.clipAction( headAnimations[1] );
        headAction.setLoop(THREE.LoopOnce);
        headAction.clampWhenFinished = true;
        p.geometry.computeVertexNormals();
        //pawnModel.children[0].material.emissive = new THREE.Color(0x00ffff);
        headModel.name = "Head";
        headModel.visible = false;
        headModel.correct_scale = {x:30, y:30, z:30}
        headModel.scale_ratio = {x:1, y:1, z:1}
        headModel.correct_position = {x: 100,y:-50};
        headModel.isModel = true;
        scene.add(headModel);
        render()
        //pawnMixer.addEventListener('finished', setNoScroll)
    }, undefined, function(error) {
        console.error(error);
    });
    
    loader.load(importedGraphModel, function(gltf) {
        graphModel = gltf.scene;
        graphAnimations = gltf.animations;
        graphMixer = new THREE.AnimationMixer(graphModel);

        const material = new THREE.MeshPhysicalMaterial( {
            color: 0xefd383,
            metalness: 0,
            roughness: 0,
            ior: 1.52,
            transmission: 1,
            specularIntensity: 1,
            specularColor: 0xffffff,
            opacity: 1,
            side: THREE.DoubleSide,
          } );

        let p = graphModel.getObjectByName('Cube');
        p.material = material;
        // Sphere to Pawn Animation
        graphAction = graphMixer.clipAction( graphAnimations[1] );
        graphAction.setLoop(THREE.LoopOnce);
        graphAction.clampWhenFinished = true;
        p.geometry.computeVertexNormals();
        //pawnModel.children[0].material.emissive = new THREE.Color(0x00ffff);
        graphModel.name = "Head";
        graphModel.visible = false;
        graphModel.correct_scale = {x:2, y:2, z:2}
        graphModel.scale_ratio = {x:10, y:10, z:10}
        graphModel.correct_position = {x: 100,y:-50};
        graphModel.isModel = true;
        scene.add(graphModel);
        render()
        //pawnMixer.addEventListener('finished', setNoScroll)
    }, undefined, function(error) {
        console.error(error);
    });

    state = STATE.BALL_MODE;
    logo_state = LOGO_STATE.MIDDLE;

    stats = Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onResize);
    parent.addEventListener('scroll', onScroll);
}

function animate(){
    requestAnimationFrame( animate );
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  
    models = {0: pawnModel, 1: horseModel, 2: mazeModel, 3: graphModel, 4:headModel}
    update_current_model();
    
    if (current_page == 0){
        //console.log(current_model,current_model.name,current_page)
    }

    //update_pages();
    switch (state){
        case STATE.BALL_MODE:
            enable_scroll();
            animate_ball_motion(true);
            break;
        case STATE.BALL_TO_MODEL:
            animate_ball_motion(false);
            switch (ball_merge_state){
                case BALL_MERGE_STATE.MERGE_FINISHED:
                    if (has_snapped){
                        displayModel();
                        has_snapped = false;
                        //isScrollEnabled = true;
                    }
                    break;
                case BALL_MERGE_STATE.MERGE_IN_PROCESS:
                    if (scene.children.filter(val => {return val.visible && val.name == "Sphere"}).every(val => !val.closest_ball)){
                        ball_merge_state = BALL_MERGE_STATE.MERGE_STAGE_DONE;
                    }
                    else{
                        merge();
                        animate_ball_motion(false);
                    }
                    
                    break;
                case BALL_MERGE_STATE.MERGE_STAGE_DONE:
                    if (scene.children.filter((val,idx,arr) => 
                        {return (val.name=="Sphere" && val.visible)}).length == 1){
                            ball_merge_state = BALL_MERGE_STATE.MERGE_FINISHED;
                        }
                    else{
                        initMerge();
                        animate_ball_motion(false);
                    }
                    break;
                case BALL_MERGE_STATE.MERGE_START:
                    initMerge();
                    break;
                case BALL_MERGE_STATE.INTERUPT_ANIMATION:
                    interupt_animation_for_merge();
                    break;
            }
            break;
        case STATE.MODEL_TO_BALL:
            switch (model_break_state){
                case MODEL_BREAK_STATE.BREAK_START:
                    break_model();
                    break;
                case MODEL_BREAK_STATE.BREAK_IN_PROCESS:
                    animate_ball_motion(false);
                    if (has_snapped){
                        break_process();
                    }
                    break;
                case MODEL_BREAK_STATE.BREAK_FINISHED:
                    state = STATE.BALL_MODE;
                    has_snapped = false;
                    break;
                case MODEL_BREAK_STATE.INTERUPT_ANIMATION:
                    interupt_animation_for_break();
            }   
            break;
        case STATE.MODEL_TO_MODEL:
            animate_ball_motion(false);
            switch (model_to_model_state){
                case MODEL_TO_MODEL_STATE.BREAK:
                    // MODEL_TO_BALL state 
                    switch (model_break_state){
                        case MODEL_BREAK_STATE.BREAK_START:
                            break_model();
                            
                            break;
                        case MODEL_BREAK_STATE.BREAK_IN_PROCESS:
                            animate_ball_motion(false);
                            if (has_snapped){
                                break_process();
                            }
                            break;
                        case MODEL_BREAK_STATE.BREAK_FINISHED:
                            model_to_model_state = MODEL_TO_MODEL_STATE.MERGE;
                            ball_merge_state = BALL_MERGE_STATE.MERGE_START;
                            break;
                        case MODEL_BREAK_STATE.INTERUPT_ANIMATION:
                            interupt_animation_for_break();
                    }   
                    break;
                case MODEL_TO_MODEL_STATE.MERGE:
                    // BALL_TO_MODEL state
                    switch (ball_merge_state){
                        case BALL_MERGE_STATE.MERGE_FINISHED:
                            if (has_snapped){
                                displayModel();
                                has_snapped = false;
                            }
                            break;
                        case BALL_MERGE_STATE.MERGE_IN_PROCESS:
                            if (scene.children.filter(val => {return val.visible && val.name == "Sphere"}).every(val => !val.closest_ball)){
                                ball_merge_state = BALL_MERGE_STATE.MERGE_STAGE_DONE;
                            }
                            else{
                                merge();
                                animate_ball_motion(false);
                            }
                            
                            break;
                        case BALL_MERGE_STATE.MERGE_STAGE_DONE:
                            if (scene.children.filter((val,idx,arr) => 
                                {return (val.name=="Sphere" && val.visible)}).length == 1){
                                    ball_merge_state = BALL_MERGE_STATE.MERGE_FINISHED;
                                }
                            else{
                                initMerge();
                                animate_ball_motion(false);
                            }
                            break;
                        case BALL_MERGE_STATE.MERGE_START:
                            initMerge();
                            break;
                        case BALL_MERGE_STATE.INTERUPT_ANIMATION:
                            interupt_animation_for_merge();
                            break;
                    }
                    break;

                 
            }
        case STATE.MODEL_MODE:
            animate_ball_motion(false);        
    }

    TWEEN.update();
    let delta = clock.getDelta();
    if (current_mixer){
        if (current_mixer == pawnMixer){
            //console.log('pawn mixing')
        }
        if (current_mixer == horseMixer){
            //console.log('horse mixing')
        }
        current_mixer.update(delta)
    }
    stats.update()
    render();
}
function render(){
    renderer.render( scene, camera );
}

function animate_ball_motion(is_boid_mode){
    if (is_boid_mode) update_boids(
        scene,
        scene.children.filter(child => {return child.name=='Sphere' && child.visible}))
    scene.children.forEach(child => {
        if (child.name == "Sphere" && child.visible){
            child.position.x = child.position.x + child.velocity.x;
            child.position.y = child.position.y + child.velocity.y;
            if (child.position.z > -800) {
                child.position.z = child.position.z + child.velocity.z;
            }
            
            // Checks sphere is in view
            if (!frustum.containsPoint(child.position)){
                child.velocity.x = child.velocity.x * -1
                child.velocity.y = child.velocity.y * -1
            }

        }
    })
}

function break_model(){
    [ current_model, current_mixer, current_animations, current_action ] = get_model_details(current_model); // Get model corresponding to page

    current_mixer.removeEventListener('finished', animation_finished);

    current_action = current_mixer.clipAction( current_animations[1] );
    current_action.setLoop(THREE.LoopOnce);
    current_action.paused = false;
    current_action.timeScale = -3;
    current_action.play();

    model_break_state = MODEL_BREAK_STATE.ANIMATION_WAIT;
    animated_model = {model: current_model, mixer: current_mixer, action: current_action}
    current_mixer.addEventListener('finished', reverse_animation_finished);

    new TWEEN.Tween(current_model.children[0].material.color).to({r:256,g:256,b:256})
    .easing(TWEEN.Easing.Quartic.In)
            .onUpdate(
                function () {
                    current_model.children[0].material.color.setRGB(this.r, this.g, this.b);
                }
            )
            .start();
}

function reverse_animation_finished(){
    //animated_model.model.visible = false;
    animated_model.model.ball.position.x = animated_model.model.position.x;
    animated_model.model.ball.position.y = animated_model.model.position.y;
    animated_model.model.ball.scale.x = animated_model.model.scale.x;
    animated_model.model.ball.scale.y = animated_model.model.scale.x;
    animated_model.model.ball.scale.z = animated_model.model.scale.x;
    animated_model.model.ball.visible = false;
    //animated_model.mixer.stopAllAction();
    model_break_state = MODEL_BREAK_STATE.BREAK_IN_PROCESS;
}

function break_process(){
    let visible_spheres = scene.children.filter(val => {return val.visible && val.name == "Sphere"})
                                        .filter(sphere => {return sphere.ballsHeld.length > 0});
    if (visible_spheres.length == 0){
        model_break_state = MODEL_BREAK_STATE.BREAK_FINISHED;
        return;
    }
    else{
        return;
    }
    visible_spheres.forEach(sphere => {
        let original_scale = sphere.scale;
        sphere.ballsHeld.forEach(ballHeld => {
            ballHeld.visible = true;
            //ballHeld.scale.x = 3/5*original_scale.x / (sphere.ballsHeld.length + 1);
           //ballHeld.scale.y = 3/5*original_scale.y / (sphere.ballsHeld.length + 1);
            //ballHeld.scale.z = 3/5*original_scale.z / (sphere.ballsHeld.length + 1);
            ballHeld.scale.x = sphere.original_scale.x;
            ballHeld.scale.y = sphere.original_scale.x;
            ballHeld.scale.z = sphere.original_scale.x;
            ballHeld.position.x = (sphere.position.x + sphere.original_scale.x*(Math.random() - 0.5));
            ballHeld.position.y = (sphere.position.y + sphere.original_scale.x*(Math.random() - 0.5));
            ballHeld.velocity.set(5 * (Math.random() - 0.5),5 * (Math.random() - 0.5),5 * (Math.random() - 0.5))
            ballHeld.closest_ball = null;
        })
        sphere.closest_ball = null;
        sphere.scale.x = sphere.original_scale.x;
        sphere.scale.y = sphere.original_scale.y;
        sphere.scale.z = sphere.original_scale.z;
        sphere.velocity.set(5 * (Math.random() - 0.5),5 * (Math.random() - 0.5),5 * (Math.random() - 0.5))
        sphere.ballsHeld = [];
    });
    
}
/*
function initMerge(){
    let number_of_central_balls = Math.floor(scene.children.filter((val,idx,arr) => 
        {return (val.name=="Sphere" && val.visible)}).length / 2)
    // Finds n random balls and sets their position to 0
    central_balls = scene.children.filter((val,idx,arr) => 
        {return (val.name=="Sphere" && val.visible)}).slice(number_of_central_balls);
    central_balls.forEach(ball => {
        //ball.velocity.x = 0;
        //ball.velocity.y = 0
        //ball.velocity.z = 0;
    }) 
    // Gets all non-central balls and sets their velocity in the direction of their closest ball
    scene.children.filter((val,idx,arr) => 
        {return val.name == "Sphere" && val.visible && central_balls.indexOf(val) == -1}).forEach(child => {
        child.closest_ball = closest_central_point(child,central_balls);
        let velocity = velocity_between_points(child,child.closest_ball);
        child.velocity.x = velocity.x/10;
        child.velocity.y = velocity.y/10;
        child.velocity.z = velocity.z/10;
    });
    ball_merge_state = BALL_MERGE_STATE.MERGE_IN_PROCESS;
}

function merge(){
    const geometry = new THREE.SphereGeometry( 1, 32, 16 );
    scene.children.filter(a => {return a.name == "Sphere" && a.visible && central_balls.indexOf(a) == -1 && a.closest_ball})
        .forEach(child => {
        if (euclidean_distance(child,child.closest_ball) < child.closest_ball.scale.x){
            //let newBall = copyBall(geometry, child.closest_ball.position, scale)
            child.closest_ball.scale.x = (child.closest_ball.scale.x/5 + child.scale.x/5)*3.5;
            child.closest_ball.scale.y = (child.closest_ball.scale.y/5 + child.scale.y/5)*3.5;
            child.closest_ball.ballsHeld.push(child);
            child.visible = false;
    }});
}
*/

function initMerge(){
    let balls = scene.children.filter((val,idx,arr) => 
        {return (val.name=="Sphere" && val.visible)});
    balls.forEach(ball => {
        ball.velocity.set(Math.random()-0.5,Math.random()-0.5,Math.random()-1)
    })
    ball_merge_state = BALL_MERGE_STATE.MERGE_FINISHED;
}
function displayModel(){
    [ current_model, current_mixer, current_animations, current_action ]= get_model_details(current_model);
    current_mixer.removeEventListener('finished', reverse_animation_finished);
    /*
    let center_ball = scene.children.filter(val => {
        return val.visible && val.name == 'Sphere';
    })[0];
    if (!center_ball){
        center_ball = scene.children.filter(val => 
            {return val.scale.x == Math.max(...scene.children.map(b => {return b.scale.x}))})[0]
    }
    else{
        center_ball.visible = false;
    }
    */
    let center_ball = scene.children.filter(val => {
        return val.visible && val.isModel;
    })[0];
    if (!center_ball){
        center_ball = scene.children.filter(val => {
            return val.visible && val.name == 'Sphere';
        })[0];
    }
    center_ball.visible = false;
    console.log(current_model.correct_position,current_model.correct_scale,current_model.scale_ratio,
        center_ball.position,center_ball.scale);

    current_model.ball = center_ball;
    current_model.position.x = center_ball.position.x;
    current_model.position.y = center_ball.position.y;
    current_model.scale.x = center_ball.scale.x/current_model.scale_ratio.x;
    current_model.scale.y = center_ball.scale.y/current_model.scale_ratio.y;
    current_model.scale.z = center_ball.scale.z/current_model.scale_ratio.z;

    new TWEEN.Tween(current_model.position).to({x:current_model.correct_position.x,y:current_model.correct_position.y}).start();
    new TWEEN.Tween(current_model.scale).to({x:current_model.correct_scale.x,
                                                y:current_model.correct_scale.x,
                                                z:current_model.correct_scale.x}).start(); 
    new TWEEN.Tween(current_model.children[0].material.color).to({r:1,b:1,g:1},1000)
    .easing(TWEEN.Easing.Quartic.In)
    .onUpdate(
        function () {
            current_model.children[0].material.color.setRGB(this.r, this.g, this.b);
        }
    ).start(); 
                                                

    current_action.timeScale = 1;
    current_action.paused = false;
    current_model.visible = true;
    current_action.play();

    // TODO
    // Change for when have to be able to reverse midanimation
    ball_merge_state = BALL_MERGE_STATE.ANIMATION_WAIT;
    animated_model = {model:current_model,mixer:current_mixer,action:current_action};
    current_mixer.addEventListener('finished', animation_finished);
}

function animation_finished(){
    ball_merge_state = BALL_MERGE_STATE.MERGE_START;
    state = STATE.MODEL_MODE;
    enable_scroll();
    console.log('scroll-enabled')
}

function interupt_merge_for_break(){

}

function interupt_animation_for_break(){
    let dipslay_model;// Get model corresponding to page
    let display_action;
    let display_mixer;
    let display_animations;
    //[ dipslay_model, display_mixer, display_animations, display_action ] = get_model_details(current_model);
    
    animated_model.action.timeScale = -5;
    animated_model.mixer.removeEventListener('finished', animation_finished);

    animated_model.mixer.addEventListener('finished',reverse_animation_finished)
}

function interupt_animation_for_merge(){
    let dipslay_model;// Get model corresponding to page
    let display_action;
    let display_animations;
    let display_mixer;
    //[ dipslay_model, display_mixer, display_animations, display_action ] = get_model_details(current_model);

    animated_model.action.timeScale = 1;
    animated_model.mixer.removeEventListener('finished', reverse_animation_finished);

    animated_model.mixer.addEventListener('finished',animation_finished)
}

let fixing = false;
scroll_state = SCROLL_STATE.UNSCROLLED;
function onScroll(){
    previous_scroll_percent = current_scroll_percent;
    current_scroll_percent = _get_scroll_percentage();
    update_pages();
    if (!isScrollEnabled){
        disable_scroll();
        return;
    }
    (document.getElementById('scrollProgress')).innerText ='Scroll Progress : ' + current_scroll_percent.toFixed(2)
    //scroll_state = SCROLL_STATE.HALF_SCROLLED;
    determine_scroll_direction();
    //console.log(scroll_state,animation_state,state,scroll_direction,previous_scroll_percent,current_scroll_percent)
    if (animation_state == ANIMATION_STATE.NORMAL){
        fixing = false;
        switch (state){
            // Start of Scroll 
            case STATE.BALL_MODE:
                state = page_transitions[current_page][current_page+scroll_direction][0];
                if (state == STATE.BALL_TO_MODEL){
                    ball_merge_state = BALL_MERGE_STATE.MERGE_START;
                }
                if (current_page == 0 && logo_state == LOGO_STATE.MIDDLE){
                    logo_state = LOGO_STATE.CORNER;
                    animate_logo(true);
                }
                break;
            case STATE.MODEL_MODE:
                state = page_transitions[current_page][current_page+scroll_direction][0];
                if (state == STATE.MODEL_TO_MODEL){
                    model_to_model_state = MODEL_TO_MODEL_STATE.BREAK;
                    model_break_state = MODEL_BREAK_STATE.BREAK_START;
                }
                if (state == STATE.MODEL_TO_BALL){
                    model_break_state = MODEL_BREAK_STATE.BREAK_START;
                    if (current_page == 1 && logo_state == LOGO_STATE.CORNER){
                        logo_state = LOGO_STATE.MIDDLE;
                        animate_logo(false);
                    }
                }
                break;
        }
        console.log("Normal State")
    }
    if (animation_state == ANIMATION_STATE.UNSNAPPED && false){
        switch (state){
            // Interupted Animation
            case STATE.MODEL_TO_BALL:
                state = STATE.BALL_TO_MODEL;
                if (model_break_state == MODEL_BREAK_STATE.BREAK_STAGE_DONE ||
                    model_break_state == MODEL_BREAK_STATE.BREAK_IN_PROCESS){
                        ball_merge_state = BALL_MERGE_STATE.MERGE_START;
                    }
                if (model_break_state == MODEL_BREAK_STATE.ANIMATION_WAIT || 
                    model_break_state == MODEL_BREAK_STATE.BREAK_FINISHED){
                        ball_merge_state = BALL_MERGE_STATE.INTERUPT_ANIMATION;
                    }
                break;
            case STATE.BALL_TO_MODEL:
                state = STATE.MODEL_TO_BALL;
                if (ball_merge_state == BALL_MERGE_STATE.ANIMATION_WAIT ||
                    ball_merge_state == BALL_MERGE_STATE.MERGE_FINISHED){
                    model_break_state = MODEL_BREAK_STATE.INTERUPT_ANIMATION;
                }
                if (ball_merge_state == BALL_MERGE_STATE.MERGE_IN_PROCESS || 
                        ball_merge_state == BALL_MERGE_STATE.MERGE_STAGE_DONE || 
                        ball_merge_state == BALL_MERGE_STATE.MERGE_START){
                    model_break_state = MODEL_BREAK_STATE.BREAK_IN_PROCESS;
                }
                break;
            case STATE.MODEL_TO_MODEL:
                if (model_to_model_state == MODEL_TO_MODEL_STATE.MERGE){
                    model_to_model_state = MODEL_TO_MODEL_STATE.BREAK;
                    model_break_state = MODEL_BREAK_STATE.INTERUPT_ANIMATION;
                }
        }
    }
    if (animation_state == ANIMATION_STATE.SNAPPED && false){
        console.log("Unsnapped State")
        switch (state){
            // Start of Scroll 
            case STATE.BALL_TO_MODEL:
                state = STATE.MODEL_TO_BALL;
                model_break_state = MODEL_BREAK_STATE.BREAK_IN_PROCESS;
                break;
            case STATE.MODEL_TO_BALL:
                state = STATE.BALL_TO_MODEL;
                ball_merge_state = BALL_MERGE_STATE.MERGE_FINISHED;
                break;
            case STATE.MODEL_TO_MODEL:
                if (model_to_model_state == MODEL_TO_MODEL_STATE.MERGE){
                    model_to_model_state = MODEL_TO_MODEL_STATE.BREAK;
                    model_break_state = MODEL_BREAK_STATE.INTERUPT_ANIMATION;
                }
        }
    }
    if (animation_state == ANIMATION_STATE.CONTINUE_SNAPPED){
        state = page_transitions[current_page-scroll_direction][current_page][0]
        switch (state){
            case STATE.MODEL_TO_MODEL:
                model_to_model_state = MODEL_TO_MODEL_STATE.BREAK;
                model_break_state = MODEL_BREAK_STATE.INTERUPT_ANIMATION;
            case STATE.MODEL_TO_BALL:
                model_break_state = MODEL_BREAK_STATE.INTERUPT_ANIMATION;
        }
    }
    if (animation_state == ANIMATION_STATE.CONTINUE_UNSNAPPED){
        state = page_transitions[current_page][current_page + scroll_direction][0]
        switch (state){
            case STATE.MODEL_TO_MODEL:
                model_to_model_state = MODEL_TO_MODEL_STATE.BREAK;
                model_break_state = MODEL_BREAK_STATE.INTERUPT_ANIMATION;
            case STATE.MODEL_TO_BALL:
                model_break_state = MODEL_BREAK_STATE.INTERUPT_ANIMATION;
        }
    }
    previous_scroll_direction = scroll_direction;
}

function determine_scroll_direction(){
    // Scolling Down
    if (current_scroll_percent > previous_scroll_percent){
        if (state == STATE.MODEL_MODE || state == STATE.BALL_MODE){
            animation_state = ANIMATION_STATE.NORMAL;
            has_snapped = false;
            normal_scroll_direction = -1;
        }
        // Opposite scroll while page not snapped
        else if (normal_scroll_direction == 1 && !has_snapped){
            animation_state = ANIMATION_STATE.UNSNAPPED;
            normal_scroll_direction = -1;
            fixing = true;
        }
        // Opposite Scroll but the page has snapped but animation is not finished (not in ball/model mode)
        else if (normal_scroll_direction == 1 && has_snapped){
            animation_state = ANIMATION_STATE.SNAPPED;
            normal_scroll_direction = -1;
            has_snapped = false;
            fixing = true;
        }
        else{
            animation_state = ANIMATION_STATE.STOPPED;
        }
        scroll_direction = 1;
    }
    // Scroll Up
    if (previous_scroll_percent > current_scroll_percent){
        // Page Snapped and Animations finished
        if (state == STATE.MODEL_MODE || state == STATE.BALL_MODE){
            animation_state = ANIMATION_STATE.NORMAL;
            has_snapped = false;
            normal_scroll_direction = 1;
        }
        // Opposite scroll while page not snapped
        else if (normal_scroll_direction == -1 && !has_snapped){
            animation_state = ANIMATION_STATE.UNSNAPPED;
            normal_scroll_direction = 1;
        }
        // Opposite Scroll but the page has snapped but animation is not finished (not in ball/model mode)
        else if (normal_scroll_direction == -1 && has_snapped){
            animation_state = ANIMATION_STATE.SNAPPED;
            normal_scroll_direction = 1;
        }
        else{
            animation_state = ANIMATION_STATE.STOPPED;
        }

        scroll_direction = -1;
    }
    if (previous_scroll_direction != scroll_direction){
        fixing = true;
    }
    previous_scroll_direction = scroll_direction;
}

function update_pages(){
    if (current_page - 1 >= 0 && scroll_page_levels[current_page - 1] == (current_scroll_percent/100).toFixed(2)){
        console.log('scroll-up page swap')
        has_snapped = true;
        previous_page = current_page;
        current_page--;
    }

    if (current_page + 1 < Object.keys(scroll_page_levels).length && scroll_page_levels[current_page + 1] == (current_scroll_percent/100).toFixed(2)){
        console.log('scroll-down page swap')
        has_snapped = true;
        previous_page = current_page;
        current_page++;
    }

    if (normal_scroll_direction == 1 && previous_scroll_percent > current_scroll_percent && has_snapped){
        isScrollEnabled = false;
        console.log('scroll_disabled');
    }
    if (normal_scroll_direction == -1 && previous_scroll_percent < current_scroll_percent && has_snapped){
        isScrollEnabled = false;
        console.log('scroll_disabled');
    }
}

function onResize(){
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

function generateBall(geometry){
    const material = {
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        metalness: 0.9,
        roughness: 0.5,
        color: 0x8418ca,
        envmap: envmap,
    }
    const object = new THREE.Mesh( geometry, new THREE.MeshPhysicalMaterial( 
        //{ color: Math.random() * 0xffffff } 
        material
        ) );
    object.scale.set(1,1,1)
    object.position.x = Math.random() * 20 - 10;
    object.position.y = Math.random() * 20 - 10;
    object.position.z = Math.random() * 20 - 10;

    object.original_scale = {x:object.scale.x,y:object.scale.y, z:object.scale.z};

    object.name = "Sphere";
    object.velocity = new THREE.Vector3(2 * (Math.random() - 0.5),2 * (Math.random() - 0.5),2 * (Math.random() - 0.5))
    object.ballsHeld = [];

    scene.add( object );

    return object;
}

function copyBall(geometry,position,scale){
    const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

    object.position.x = position.x || Math.random() * 20 - 10;
    object.position.y = position.y || Math.random() * 20 - 10;
    object.position.z = 0;

    object.scale.x = scale.x || object.scale.x;
    object.scale.y = scale.y || object.scale.y;
    object.scale.z = scale.z || object.scale.z;

    object.name = "Sphere";
    object.velocity = new THREE.Vector3(2 * (Math.random() - 0.5),2 * (Math.random() - 0.5),2 * (Math.random() - 0.5))

    object.ballsHeld = [];

    scene.add( object );

    return object;
    
}

function animate_logo(minimize){
    if (minimize){
        new TWEEN.Tween(logoModel.position).to({x:200,y:-100,z:0}).start();
        new TWEEN.Tween(logoModel.scale).to({x:5,y:5,z:5}).start();
    }
    else{
        new TWEEN.Tween(logoModel.position).to({x:-50,y:-30,z:0}).start();
        new TWEEN.Tween(logoModel.scale).to({x:20,y:20,z:20}).start();
    }
    
}
function update_current_model(){
    current_model = models[model_page[current_page]];
}

function get_model_details(){
    if (current_model == pawnModel){
        return [ pawnModel, pawnMixer, pawnAnimations, pawnAction ];
    }
    else if (current_model == horseModel){
        return [ horseModel, horseMixer, horseAnimations, horseAction ];
    }
    else if (current_model == mazeModel){
        return [ mazeModel, mazeMixer, mazeAnimations, mazeAction ]
    }
    else if (current_model == headModel){
        return [ headModel, headMixer, headAnimations, headAction ];
    }
    else if (current_model == graphModel){
        return [ graphModel, graphMixer, graphAnimations, graphAction ]
    }
}

function closest_central_point(target,origins){
    let distances = new Array(origins.length);
    distances = origins.map(origin => {return euclidean_distance(origin,target)})
    return origins[distances.indexOf(Math.min(...distances))];
}

function euclidean_distance(a,b){
    return Math.hypot(a.position.x-b.position.x, a.position.y-b.position.y)
}

function velocity_between_points(origin,target){
    return {x:target.position.x - origin.position.x, y:target.position.y - origin.position.y, 
        z:target.position.z - origin.position.z}
}

/**
 * Get current browser viewpane heigtht
 */
 function _get_window_height() {
    return window.innerHeight || 
           document.documentElement.clientHeight ||
           document.body.clientHeight || 0;
}

/**
 * Get current absolute window scroll position
 */
function _get_window_Yscroll() {
    return window.pageYOffset || 
           document.body.scrollTop ||
           document.documentElement.scrollTop || 
           parent.scrollTop || 0;
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
        parent.scrollHeight || 0.
    );
}


/**
 * Get current vertical scroll percentage
 */
function _get_scroll_percentage() {
    return (
        (_get_window_Yscroll() + _get_window_height()) / _get_doc_height()
    ) * 100;
}
function disable_scroll(){
    // Get the current page scroll position
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop || parent.scrollTop;
    let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    parent.classList.add('disable-scroll');
    parent.scrollTo(scrollLeft, scrollTop);
}

function enable_scroll(){
    parent.classList.remove('disable-scroll');
    isScrollEnabled = true;
}

export default scene;
