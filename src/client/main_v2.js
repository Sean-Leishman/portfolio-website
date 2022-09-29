import fullpage from "fullpage.js";
import { init_fp } from "./scroll_handler.js";
import { init, animate } from "./three_handler.js";
import { handle_images } from "./image_handler.js";
import { animateText  } from "./text_animations.js";
import $ from "jquery";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import * as THREE from "three";
import HDR from "./assets/static/sepulchral_chapel_rotunda_2k.hdr";

jQuery(document).ready(function() {

  const hdrEquirect = new RGBELoader().load(HDR, async function(hdrmap) {
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    console.log("Initialise three.js")
    await init(hdrmap, hdrEquirect);
    console.log("Initialise fullpage.js")
    await init_fp();
    console.log("Init Animatons")
    await animate();
    await onLoaded();
    await handle_images();
    //render();
  });
  console.log("Document ready");
  console.log(window.innerWidth,window.innerHeight)

  document.querySelector('#page-heading').addEventListener('animationstart', () => {
    animateText();
  })
  //init();
  //animate();
});

async function onLoaded(){
  document.getElementById('loader').style.display = "none";
  document.getElementsByClassName('container')[0].style.opacity = 1;
  document.getElementsByClassName('container')[0].style.visibility = 'visible';
  document.body.classList.remove('no-scroll');
}
