import * as THREE from 'three';
import importedHorseModel from './assets/models/basic_horse.glb';
import '../main.js';

class HorseModel {
    constructor(loader){
        this.loader = loader;
        this.model;
        this.animations;
        this.mixer;
    }

    load_model(){
        let model;
        let animations;
        let mixer;
        let action;
        this.loader.load(importedHorseModel, function(gltf) {
            model = gltf.scene;
            animations = gltf.animations;
            mixer = new THREE.AnimationMixer(model);
            // Sphere to Pawn Animation
            action = mixer.clipAction( animations[1] );
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
    
            model.children[0].material.emissive = new THREE.Color(0x00ffff);
            model.name = "Pawn";
            model.visible = false;
            //scene.add(model);
            console.log(gltf)
            //pawnMixer.addEventListener('finished', setNoScroll)
        }, undefined, function(error) {
            console.error(error);
        });
        this.set_model_parameters(model,animations,mixer);
        console.log(this);
    }

    set_model_parameters(model,animations,mixer){
        this.model = model;
        this.animations = animations;
        this.mixer = mixer;
    }
}

export default HorseModel;