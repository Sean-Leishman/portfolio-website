import * as THREE from 'three';
import * as TWEEN from 'tween';
import { Mesh, RedFormat } from 'three';

let container;
let camera, scene, renderer, raycaster;
let object1,object2,object3;
let objects;

let INTERSECTED;
let CLICKINTERSECTED;
let theta = 0;

const CUBESIZE = 1;
const pointer = new THREE.Vector2();

console.log("statis")

init();
animate();

function init(){
    container = document.createElement('section');
    let parent = document.getElementsByClassName('container')[0]
    parent.appendChild( container );
    container.classList.add('content')
    camera = new THREE.PerspectiveCamera(20, window.innerWidth/window.innerHeight,1,10000);
    camera.position.z = 15

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const ambientLight = new THREE.AmbientLight( 0x404040,2 );
    const directionalLight = new THREE.DirectionalLight( 0x404040, 4);
    directionalLight.position.set(10,10,10);
    
	scene.add( ambientLight );
    scene.add(directionalLight );

    console.log("run init")

    const geometry = new THREE.BoxGeometry( 1, 1, 1);
    
    const material1 = new THREE.MeshLambertMaterial( {color: 0xa0fefb}); 
    object1 = new THREE.Mesh ( geometry, material1);
    object1.position.set(object1.position.x+2,object1.position.y,object1.position.z);
    scene.add( object1 )

    const material2 = new THREE.MeshLambertMaterial( {color: 0x494fc1}); 
    object2 = new THREE.Mesh ( geometry, material2);
    object2.position.set(object2.position.x,object2.position.y,object2.position.z);
    scene.add( object2 )

    const material3 = new THREE.MeshLambertMaterial( {color: 0xfd084a}); 
    object3 = new THREE.Mesh ( geometry, material3);
    object3.position.set(object3.position.x-2,object3.position.y,object3.position.z);
    scene.add( object3 )

    objects = [object1,object2,object3]

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement);
    
    document.addEventListener( 'mousemove', onPointerMove );
    document.addEventListener( 'mousedown', onMouseClick);
}

function onPointerMove( event ){
    pointer.x = (event.clientX/ window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY/window.innerHeight) * 2 - 1;
}

function onMouseClick( event ){
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    raycaster.setFromCamera( pointer, camera);
    const intersects = raycaster.intersectObjects( scene.children, false );
    if (intersects.length > 0){
        if (CLICKINTERSECTED != intersects[0].object){

            CLICKINTERSECTED = intersects[ 0 ].object;
            console.log(CLICKINTERSECTED)
            largenAnimation(CLICKINTERSECTED,window.innerWidth/(CUBESIZE*100))
        }
    } 
}

function render(){
    raycaster.setFromCamera( pointer, camera);
    const intersects = raycaster.intersectObjects( scene.children, false );
    if ( intersects.length > 0) {

        if ( INTERSECTED != intersects[ 0 ].object ) {

            if ( INTERSECTED ) setSize(INTERSECTED,CUBESIZE,CUBESIZE,CUBESIZE);


            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentSize = CUBESIZE;
            INTERSECTED.currentSize = INTERSECTED.currentSize+0.01;
            INTERSECTED.maxSize = 1.5;
            INTERSECTED.minSize = 1;
            setSize(INTERSECTED,INTERSECTED.currentSize,INTERSECTED.currentSize,INTERSECTED.currentSize);
        }
        else{
            if (INTERSECTED.currentSize < INTERSECTED.maxSize) {
                setSize(INTERSECTED,INTERSECTED.currentSize,INTERSECTED.currentSize,INTERSECTED.currentSize);
                INTERSECTED.currentSize = INTERSECTED.currentSize+0.01;
            }
        }

    } else if (CLICKINTERSECTED == null) {

        //if ( INTERSECTED ) setSize(INTERSECTED,CUBESIZE,CUBESIZE,CUBESIZE);
        if (INTERSECTED){
            if (INTERSECTED.currentSize > INTERSECTED.minSize){
                INTERSECTED.currentSize -= 0.01
                setSize(INTERSECTED,INTERSECTED.currentSize,INTERSECTED.currentSize,INTERSECTED.currentSize);
            }
            else{
                INTERSECTED = null;
            }
        }

    }

    renderer.render( scene, camera );
}

function animate(){
    requestAnimationFrame( animate );

    rotateAnimation(objects)

    TWEEN.update();

	render();
}

function setSize(myMesh, xSize, ySize, zSize){
    let scaleFactorX = xSize / myMesh.geometry.parameters.width;
    let scaleFactorY = ySize / myMesh.geometry.parameters.height;
    let scaleFactorZ = zSize / myMesh.geometry.parameters.depth;
    myMesh.scale.set( scaleFactorX, scaleFactorY, scaleFactorZ);
}

function largenAnimation(cube,newSize){
    //TWEEN.removeAll();
    objects = objects.filter(object => object != cube)
    new TWEEN.Tween(cube.scale).to({x:newSize,y:newSize,z:newSize},3000).start();
    new TWEEN.Tween(cube.rotation).to({x:0,y:0},3000).start();
}

function rotateAnimation(objects){
    objects.forEach(cube => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.01;
    })
}
