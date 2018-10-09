import * as THREE from 'three';
import { AR } from 'expo-ar';

export default class Camera extends THREE.PerspectiveCamera {
  constructor(width, height, near, far) {
    super();

    this.width = width;
    this.height = height;
    this.aspect = height > 0 ? width / height : 0;
    this.near = near;
    this.far = far;
  }

  updateMatrixWorld = async () => {
    if (this.width > 0 && this.height > 0) {
      const matrices = await AR.getMatricesAsync(this.near, this.far);
      if (matrices && matrices.viewMatrix) {
        this.matrixWorldInverse.fromArray(matrices.viewMatrix);
        this.matrixWorld.getInverse(this.matrixWorldInverse);
        this.projectionMatrix.fromArray(matrices.projectionMatrix);
      }
    }
  };

  updateProjectionMatrix = this.updateMatrixWorld;
}
