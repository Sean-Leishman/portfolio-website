import * as THREE from 'three';
import * as TWEEN from 'tween';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import pawnModel from './models/chess.glb';

let container,parent;
let camera, scene, renderer, raycaster, frustum, loader, mixer,clock;

init();
//animate();

function init(){
    container = document.createElement('section');
    parent = document.getElementsByClassName('container')[0]
    parent.appendChild( container );
    container.classList.add('content')


    camera = new THREE.PerspectiveCamera(20, window.innerWidth/window.innerHeight,1,10000);
    camera.position.z = 20;
    camera.position.y = 5;
    camera.rotation.x = -0.15
    console.log(camera.rotation)
    //camera.rotation.y = 91;

    frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    clock = new THREE.Clock();

    loader = new GLTFLoader();
    loader.load(pawnModel, function(gltf) {
        const model = gltf.scene;
        const animations = gltf.animations;
        console.log(gltf)
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction( animations[1] );
        action.play();

        scene.add(gltf.scene);
        animate();
        
    }, undefined, function(error) {
        console.error(error);
    });

    const geometry = new THREE.SphereGeometry( 15, 32, 16 );
    const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

    const ambientLight = new THREE.AmbientLight( 0x404040,2 );
    const directionalLight = new THREE.DirectionalLight( 0x404040, 4);
    directionalLight.position.set(10,10,10);
    
	scene.add( ambientLight );
    scene.add( directionalLight );
    
    console.log(scene)
    console.log(mixer)
    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
}

function animate(){
    requestAnimationFrame( animate );
    const delta = clock.getDelta();
    mixer.update( delta );
    renderer.render( scene, camera );
}