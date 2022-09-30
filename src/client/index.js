import 'fullpage.js/dist/fullpage.css';
import './index.css';
import './animator.js';
import './main_v2.js';
//import './floating_shapes.js
//import './static_cubes.js';
//import './chess.js';
import './assets/images/chess-gameplay.png';
import './assets/images/river_forest_sunset_144468_3840x2160.jpg';
import './assets/images/drawing.png';
import './assets/images/drawing.svg';
import './boids.js';
import './init_models.js';

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore/lite';
/*
const firebaseConfig = {
    apiKey: "AIzaSyAKpwy-KRcA-u8loE638kmip_qiaWRZItA",
    authDomain: "portolfio-2c85b.firebaseapp.com",
    projectId: "portolfio-2c85b",
    storageBucket: "portolfio-2c85b.appspot.com",
    messagingSenderId: "433920767655",
    appId: "1:433920767655:web:b6b3b842901765ab45cd82",
    measurementId: "G-M200SV9SNS"
  };
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);
*/