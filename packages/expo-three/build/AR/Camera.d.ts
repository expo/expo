import * as THREE from 'three';
export default class Camera extends THREE.PerspectiveCamera {
    updateMatrixWorld: () => Promise<void>;
    updateProjectionMatrix: () => Promise<void>;
}
