import * as THREE from 'three';
import { Vector3 } from 'three';

let boids;
const visualRange = 40;
let width = window.innerWidth;
let height = window.innerHeight;
let containment_box;
let avoidance_box;

//let dir = new THREE.Vector3();
let ray = new THREE.Raycaster(new Vector3(),new Vector3(),0,visualRange);

function distance(boid1, boid2) {
    return Math.sqrt(
      (boid1.position.x - boid2.position.x) * (boid1.position.x - boid2.position.x) +
        (boid1.position.y - boid2.position.y) * (boid1.position.y - boid2.position.y) + 
        (boid1.position.z - boid2.position.z) * (boid1.position.z - boid2.position.z),
    );
  }

function direction(boid, box){
  ray.set(boid.position,boid.velocity.normalize());
  return ray.intersectObject(box);
}

// TODO: This is naive and inefficient.
function nClosestBoids(boid, n) {
    // Make a copy
    const sorted = boids.slice();
    // Sort the copy by distance from `boid`
    sorted.sort((a, b) => distance(boid, a) - distance(boid, b));
    // Return the `n` closest
    return sorted.slice(1, n + 1);
  }

// Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {
    const margin = 8;
    const turnFactor = 0.21;
    
    let x_edge = containment_box.geometry.parameters.width/2;
    let y_edge = containment_box.geometry.parameters.height/2;
    let z_edge = containment_box.geometry.parameters.depth/2;
    if (boid.position.x < containment_box.position.x-x_edge-margin) {
      boid.velocity.x += turnFactor;
    }
    if (boid.position.x > containment_box.position.x+x_edge+margin) {
      boid.velocity.x -= turnFactor
    }
    if (boid.position.y < containment_box.position.y-y_edge-margin) {
        boid.velocity.y += turnFactor;
    }
    if (boid.position.y > containment_box.position.y+y_edge+margin) {
        boid.velocity.y -= turnFactor;
    }
    if (boid.position.z < containment_box.position.z-z_edge-margin) {
        boid.velocity.z += turnFactor;
    }
    if (boid.position.z > containment_box.position.z+z_edge+margin) {
        boid.velocity.z -= turnFactor;
    }
  }

function avoidObstacles(boid){
  const turnFactor = 0.21;

  let x_edge = avoidance_box.geometry.parameters.width/2;
  let y_edge = avoidance_box.geometry.parameters.height/2;
  let z_edge = avoidance_box.geometry.parameters.depth/2;
  if (direction(boid, avoidance_box).length > 0){
    if (boid.position.x < containment_box.position.x) {
      boid.velocity.x -= turnFactor;
    }
    if (boid.position.x > containment_box.position.x) {
      boid.velocity.x += turnFactor
    }
    if (boid.position.y < containment_box.position.y) {
        boid.velocity.y -= turnFactor;
    }
    if (boid.position.y > containment_box.position.y) {
        boid.velocity.y += turnFactor;
    }
    if (boid.position.z < containment_box.position.z) {
        boid.velocity.z -= turnFactor;
    }
    if (boid.position.z > containment_box.position.z) {
        boid.velocity.z += turnFactor;
    }
  }
}
  // Find the center of mass of the other boids and adjust velocity slightly to
// point towards the center of mass.
function flyTowardsCenter(boid) {
    const centeringFactor = 0.0007; // adjust velocity by this %
  
    let centerX = 0;
    let centerY = 0;
    let centerZ = 0;
    let numNeighbors = 0;
  
    for (let otherBoid of boids) {
      if (distance(boid, otherBoid) < visualRange) {
        centerX += otherBoid.position.x;
        centerY += otherBoid.position.y;
        centerZ += otherBoid.position.z;
        numNeighbors += 1;
      }
    }
  
    if (numNeighbors) {
      centerX = centerX / numNeighbors;
      centerY = centerY / numNeighbors;
      centerZ = centerZ / numNeighbors;

      boid.velocity.x += (centerX - boid.position.x) * centeringFactor;
      boid.velocity.y += (centerY - boid.position.y) * centeringFactor;
      boid.velocity.z += (centerZ - boid.position.z) * centeringFactor;
    }
  }

// Move away from other boids that are too close to avoid colliding
function avoidOthers(boid) {
    const minDistance = 10; // The distance to stay away from other boids
    const avoidFactor = 0.06; // Adjust velocity by this %
    let moveX = 0;
    let moveY = 0;
    let moveZ = 0;
    for (let otherBoid of boids) {
      if (otherBoid !== boid) {
        if (distance(boid, otherBoid) < minDistance) {
          moveX += boid.position.x - otherBoid.position.x;
          moveY += boid.position.y - otherBoid.position.y;
          moveZ += boid.position.z - otherBoid.position.z;
        }
      }
    }
  
    boid.velocity.x += moveX * avoidFactor;
    boid.velocity.y += moveY * avoidFactor;
    boid.velocity.z += moveZ * avoidFactor;
  }

// Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function matchVelocity(boid) {
    const matchingFactor = 0.05; // Adjust by this % of average velocity
  
    let avgDX = 0;
    let avgDY = 0;
    let avgDZ = 0;
    let numNeighbors = 0;
  
    for (let otherBoid of boids) {
      if (distance(boid, otherBoid) < visualRange) {
        avgDX += otherBoid.velocity.x;
        avgDY += otherBoid.velocity.y;
        avgDZ += otherBoid.velocity.z;
        numNeighbors += 1;
      }
    }
  
    if (numNeighbors) {
      avgDX = avgDX / numNeighbors;
      avgDY = avgDY / numNeighbors;
      avgDZ = avgDZ / numNeighbors;
  
      boid.velocity.x += (avgDX - boid.velocity.x) * matchingFactor;
      boid.velocity.y += (avgDY - boid.velocity.y) * matchingFactor;
      boid.velocity.z += (avgDZ - boid.velocity.z) * matchingFactor;
    }
  }

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {
    const maxSpeed = 6;
    const minSpeed = 3;
    const speed = Math.sqrt(boid.velocity.x * boid.velocity.x + boid.velocity.y * boid.velocity.y
        + boid.velocity.z * boid.velocity.z);
    if (speed > maxSpeed) {
      boid.velocity.x = (boid.velocity.x / speed) * maxSpeed;
      boid.velocity.y = (boid.velocity.y / speed) * maxSpeed;
      boid.velocity.z = (boid.velocity.z / speed) * maxSpeed;
    }
    if (speed < minSpeed) {
        boid.velocity.x = (boid.velocity.x / speed) * minSpeed;
        boid.velocity.y = (boid.velocity.y / speed) * minSpeed;
        boid.velocity.z = (boid.velocity.z / speed) * minSpeed;
      }
  }

function update_boids(scene,input_boids){
    if (containment_box == null){
      containment_box = scene.children.filter(child => {return child.name == 'Containment Box'})[0];
      avoidance_box = scene.children.filter(child => {return child.name == 'Avoidance Box'})[0];
    }
    boids = input_boids;
    //avoidance_box = avoidance_box.getObjectByName('rect453')
    containment_box.geometry.computeBoundingBox();
    for (let boid of boids) {
        // Update the velocities according to each rule
        flyTowardsCenter(boid);
        avoidOthers(boid);
        matchVelocity(boid);
        limitSpeed(boid);
        keepWithinBounds(boid);
        //avoidObstacles(boid);
    }
    //console.log(boids[0].position.x,boids[0].velocity.x)
    //console.log(boids[0].position.y,boids[0].velocity.y)
    //console.log(boids[0].position.z,boids[0].velocity.z)
}

export default update_boids;