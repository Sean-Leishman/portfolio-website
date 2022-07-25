import './index.css';
//import 'fullpage.css';
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

import fullpage from 'fullpage.js';
import ChessImg from './assets/images/chess-gameplay-2.png';

const chess_img = document.querySelector('.chess-example');
chess_img.src = ChessImg;

new fullpage('#fullpage', {
	//options here
	//anchors:['about','project-1','project-2','project-3','project-4','project-5'],
    fixedElements: '.webgl',
    scrollOverflow: true,
    licenseKey:'30AKK-H9O08-A2J18-L0PHH-RQRPO',
    scrollBar: true
});
