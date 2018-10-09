import * as THREE from 'three';

//TODO: Evan: Add Physics
class ShadowFloor extends THREE.Mesh {
  constructor({ width, height, opacity }) {
    const material = new THREE.ShadowMaterial();
    material.opacity = opacity;
    super(new THREE.PlaneBufferGeometry(width, height, 32, 32), material);
    this.receiveShadow = true;
    this.rotation.x = -Math.PI / 2;
  }
}
export default ShadowFloor;
