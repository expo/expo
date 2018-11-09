import * as THREE from 'three';
import { AR } from 'expo-ar';

export default class Camera extends THREE.PerspectiveCamera {
  updateProjectionMatrix = this.updateMatrixWorld;

  updateMatrixWorld = async () => {
    const matrices = await AR.getMatricesAsync(this.near, this.far);
    if (matrices && matrices.viewMatrix) {
      this.matrixWorldInverse.fromArray(matrices.viewMatrix);
      this.matrixWorld.getInverse(this.matrixWorldInverse);
      this.projectionMatrix.fromArray(matrices.projectionMatrix);
    }
  };
}
