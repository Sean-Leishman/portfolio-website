import * as THREE from 'three';
import * as TWEEN from 'tween';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader';
import HDR from './assets/static/sepulchral_chapel_rotunda_2k.hdr';
import importedPawnModel from './assets/models/chess.glb';
import importedHorseModel from './assets/models/basic_horse.glb';
import importedMazeModel from './assets/models/maze.glb';
import importedHeadModel from './assets/models/head.glb';
import importedGraphModel from './assets/models/sort_graph.glb';

function init_pawnModel(loader){
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
        pawnModel.correct_position = {x: 100,y:-80};
        scene.add(pawnModel);
        render()
        //pawnMixer.addEventListener('finished', setNoScroll)
    }, undefined, function(error) {
        console.error(error);
    });

    return pawnModel, pawnMixer, pawnAnimations, pawnAction
}

export default {init_pawnModel};