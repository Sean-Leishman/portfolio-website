import * as THREE from 'three';
import * as TWEEN from 'tween';
import { remove } from 'tween';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import pawnModel from './models/chess.glb';
import { gsap } from 'gsap';
import { AnimationMixer } from 'three';
let reverse_action;
let container,parent,canvas;
let camera, scene, renderer, raycaster, frustum,loader,clock;
let model,mixer,action,animations;
let animated_models = [pawnModel,pawnModel];
let model_idx = -1;
let chosen_model;
let scroll_pos = 0;
let sizes;
let central_balls;
let isMergeChess = false;
let merge_init = false;
let isBreak = false;
let inProcess = false;
let scroll_fired = false;
let will_merge = false;
let timer = null;
let scroll_percent = 0;
init();
animate();

function init(){
    canvas = document.querySelector('canvas.webgl');
    container = document.createElement('section')
    //console.log(container)
    parent = document.getElementsByClassName('container')[0]
    parent.appendChild( container );
    //container.classList.add('webgl')


    camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight,1,10000);
    camera.position.z = 100

    frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const ambientLight = new THREE.AmbientLight( 0x404040,2 );
    const directionalLight = new THREE.DirectionalLight( 0x404040, 2);
    directionalLight.position.set(10,10,10);
    
	scene.add( ambientLight );
    scene.add( directionalLight );
    scene.spheres = 50;
    
    const geometry = new THREE.SphereGeometry( 1, 32, 16 );
    for ( let i = 0; i < 100; i ++ ) {

        const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

        object.position.x = Math.random() * 20 - 10;
        object.position.y = Math.random() * 20 - 10;
        object.position.z = 0;

        //object.scale.x = Math.random() + 0.1;
        object.scale.y = object.scale.x;
        object.scale.z = object.scale.x;

        object.name = "Sphere";
        object.velocity = {x: 2 * (Math.random() - 0.5), y:2 * (Math.random() - 0.5)};

        scene.add( object );
    }

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearAlpha(0)
    //container.appendChild( renderer.domElement );

    sizes = {
        width:window.innerWidth,
        height:window.innerHeight,
    }
    parent.addEventListener( 'scroll', () => {
        clearTimeout(timer);
        scrollPercent = _get_scroll_percentage();
        (document.getElementById('scrollProgress')).innerText ='Scroll Progress : ' + scrollPercent.toFixed(2)
        /*timer = setTimeout(function() {
            console.log('waiting')
            onMouseClick();
        },50)*/
        console.log(scrollPercent);
    });
    window.addEventListener( 'resize', onResize )
}

function animate(){
    requestAnimationFrame( animate );
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  
    if (!isBreak && isMergeChess) {
        mergeContainer(scene.spheres)
    };
    if (isBreak && !inProcess) initBreak();
    scene.children.forEach(child => {
        if (child.name == "Sphere"){
            child.position.x = child.position.x + child.velocity.x;
            child.position.y = child.position.y + child.velocity.y;
            if (!frustum.containsPoint(child.position)){
                //console.log("Out of View")
                child.velocity.x = child.velocity.x * -1
                child.velocity.y = child.velocity.y * -1
            }

        }
    })
    TWEEN.update();
    let delta = clock.getDelta();
    if (mixer){
        mixer.update(delta)
    }
    renderer.render( scene, camera );
}

function mergeContainer(n){
    scene.spheres = n;
    if (!merge_init && n > 1){
        initMerge(n);
        merge_init = true;
    }
    if (scene.children.filter(a => {return a.name=="Sphere"}).length == n && isMergeChess){
        initMerge(Math.floor(n/2))
        mergeContainer(Math.floor(n/2))
    }
    merge();
}

function initMerge(n){
    scroll_fired = true;
    if ((n<1) && isMergeChess == true){
        loader = new GLTFLoader();
        console.log(chosen_model)
        loader.load(chosen_model, function(gltf) {
            model = gltf.scene;
            animations = gltf.animations;
            mixer = new THREE.AnimationMixer(model);
            action = mixer.clipAction( animations[1] );
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            model.scale.x = central_balls[0].scale.x/1.83;
            model.scale.y = central_balls[0].scale.y/1.83;
            model.scale.z = central_balls[0].scale.z/1.83;
            model.position.x = central_balls[0].position.x;
            model.position.y = (central_balls[0].position.y-1.83 * model.scale.y) ;
            model.position.z = central_balls[0].position.z;
            model.name = "Pawn";
            scene.remove(central_balls[0])
            scene.add(gltf.scene);
            model.children[0].material.emissive = new THREE.Color(0x00ffff);
            new TWEEN.Tween(model.position).to({x:30,y:-30}).start();
            new TWEEN.Tween(model.scale).to({x:model.scale.x*4,y:model.scale.y*4}).start();
            action.play();

            mixer.addEventListener('finished', setNoScroll)
            isMergeChess = false;
            console.log(scene)
            //new TWEEN.Tween(cube.scale).to({x:newSize,y:newSize,z:newSize},3000).start();
            animate();
        }, undefined, function(error) {
            console.error(error);
        });
        merge_init = false;
        return;
    }

    central_balls = scene.children.filter((a,idx,c) => {return (a.name=="Sphere" && idx >= c.length - n && idx < c.length)})
    central_balls.forEach(ball => {
        ball.velocity.x = 0;
        ball.velocity.y = 0
    })   
    scene.children.filter((a,idx,arr) => {return a.name == "Sphere" && central_balls.indexOf(a) == -1}).forEach(child => {
        child.closest_ball = closest_central_point(child,central_balls)
        let velocity = velocity_between_points(child,child.closest_ball);
        child.velocity.x = velocity.x/10;
        child.velocity.y = velocity.y/10;
        //child.velocity.x = 0;
        //child.velocity.y = 0;
        //new TWEEN.Tween(child.position).to({x:child.closest_ball.position.x,y:child.closest_ball.position.y})
    });
}

function merge(){
    let removeableBalls = new Array();
    scene.children.filter(a => {return a.name == "Sphere" && central_balls.indexOf(a) == -1}).forEach(child => {
        if (euclidean_distance(child,child.closest_ball) < child.closest_ball.scale.x){
            child.closest_ball.scale.x = (child.closest_ball.scale.x/5 + child.scale.x/5)*3.5;
            child.closest_ball.scale.y = (child.closest_ball.scale.y/5 + child.scale.y/5)*3.5;
            child.closest_ball.scale.z = (child.closest_ball.scale.z/5 + child.scale.z/5)*3.5;
            scene.remove(child)
            /*let xscale = (child.closest_ball.scale.x/5 + child.scale.x/5)*3.5;
            let yscale = (child.closest_ball.scale.y/5 + child.scale.y/5)*3.5;
            let zscale = (child.closest_ball.scale.z/5 + child.scale.z/5)*3.5;
            new TWEEN.Tween(child.closest_ball.scale).to({
                x:xscale,
                y:yscale,
                z:zscale
            },100).start().onComplete(() =>scene.remove(child))
            */
        //new TWEEN.Tween(child.position).to({x:closest_point.position.x,y:closest_point.position.y},5000).start();
    }});
}

function initBreak(){
    inProcess = true;
    mixer.removeEventListener('finished', setNoScroll)
    reverse_action = mixer.clipAction( animations[1] );
    reverse_action.setLoop(THREE.LoopOnce);
    reverse_action.timeScale = -10;
    reverse_action.paused = false
    //action.clampWhenFinished = true;
    reverse_action.play()
    mixer.addEventListener('finished', function ( event ){
        model.visible = false;
        scene.remove(model);
        inProcess = false;
        breakProcess();
        if (!isMergeChess){
            scroll_fired = false;
        }
    });
}

function breakProcess(){
    scene.spheres = 50;
    const geometry = new THREE.SphereGeometry( 1, 32, 16 );
    for ( let i = 0; i < 100; i ++ ) {

        const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

        object.position.x = Math.random() * model.position.x + 10;
        object.position.y = Math.random() * model.position.y;
        object.position.z = 0;

        //object.scale.x = Math.random() + 0.1;
        object.scale.y = object.scale.x;
        object.scale.z = object.scale.x;

        object.name = "Sphere";
        object.velocity = {x: 2 * (Math.random() - 0.5), y:2 * (Math.random() - 0.5)};

        scene.add( object );
    }
    inProcess = false;
    isBreak = false;
}

function onMouseClick( event ){
    if (scroll_fired){
        return;
    }
    scroll_fired = true;
    let scrollingDown = isScrollDown(event)
    if (scrollingDown == 1 && !inProcess){
        model_idx ++;
        chosen_model = animated_models[model_idx];
        console.log("Scroll Down",model_idx,animated_models,animated_models[model_idx])
        console.log(isBreak,isMergeChess,inProcess)
        if (model_idx < animated_models.length){
            will_merge = true;
            if (model_idx > 0){
                isBreak = true;
                isMergeChess = true;
            }
            else{
                isMergeChess = true;
            }          
        }
        else{
            isBreak = true;
            isMergeChess = false;
        }
    }
    else if (scrollingDown == 0 && !inProcess){
        model_idx --;
        chosen_model = animated_models[model_idx];
        console.log("Scroll Up",model_idx,animated_models,animated_models[model_idx])
        if (model_idx >= 0){
            isBreak = true;
            isMergeChess = true;
        }
        else{
            isBreak = true;
            isMergeChess = false;
        }
    }
    else if (scrollingDown == -1){
        scroll_fired = false;
    }
/*     if (isBreak && !inProcess){
        initBreak();
    }
    console.log(isBreak,isMergeChess,inProcess)
    if (!isMergeChess && !inProcess){
        console.log("Called Merge")
        initMerge(50)
        isMergeChess = true;
    } */
}

function onResize(){
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    return {x:target.position.x - origin.position.x, y:target.position.y - origin.position.y}
}
let previous_section;
let current_section;
//TODO
function isScrollDown( event ){
    let sections = Array.from(document.querySelectorAll('section'));
    //previous_section = sections.filter((a) => {return a.getBoundingClientRect().top < window.innerHeight/2 
    //                    && a.getBoundingClientRect().y > -window.innerHeight/2})[0];
    //current_section = sections.filter((a) => {return (a.getBoundingClientRect().y < window.innerHeight 
    //                    && a.getBoundingClientRect().y > window.innerHeight - window.innerHeight/2) 
    current_section = sections.filter((a) => {return Math.abs(a.getBoundingClientRect().top - parent.getBoundingClientRect().top) < 10})[0];
    if (!previous_section){
        console.log(sections.indexOf(current_section), sections.indexOf(previous_section),sections)
        console.log(-1,previous_section,current_section,sections);
        previous_section = current_section;
        return 1;
    }
    if (sections.indexOf(current_section) > sections.indexOf(previous_section)){
        console.log(sections.indexOf(current_section), sections.indexOf(previous_section),
            previous_section.getBoundingClientRect(),current_section.getBoundingClientRect())
        console.log(1,previous_section,current_section,sections)
        previous_section = current_section;
        return 1;
    }
    if (sections.indexOf(current_section) < sections.indexOf(previous_section)){
        console.log(sections.indexOf(current_section), sections.indexOf(previous_section),
            previous_section.getBoundingClientRect(),current_section.getBoundingClientRect())
        console.log(0,previous_section,current_section,sections)
        previous_section = current_section;
        return 0;
    }
    //scroll_fired = false;
    console.log(sections.indexOf(current_section), sections.indexOf(previous_section),
        previous_section.getBoundingClientRect(),current_section.getBoundingClientRect())
    console.log(-1,previous_section,current_section,sections)
    return -1;
}

function setNoScroll(){
    scroll_fired = !scroll_fired;
}

function scrollPercent(start,end){
    return (scrollPercent-start)/(end-start)
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
    console.log(document.documentElement.scrollHeight);
    console.log(document.body.clientHeight);
    console.log(parent.clientHeight)
    return (
        (_get_window_Yscroll() + _get_window_height()) / _get_doc_height()
    ) * 100;
}

function disable_scroll(){
    document.querySelector('.container').classList.add('disable-scroll');
}

function enable_scroll(){
    document.querySelector('.container').classList.remove('disable-scroll');
  }