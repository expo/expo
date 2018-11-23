import * as THREE from 'three';
declare class MagneticObject extends THREE.Object3D {
    recentMagneticPositions: THREE.Vector3[];
    anchorsOfVisitedPlanes: any[];
    maintainScale: boolean;
    maintainRotation: boolean;
    constructor();
    updateForAnchor: (position: any, planeAnchor: any, camera: any) => void;
    update: (camera: any, screenPosition: any) => Promise<void>;
    isValidVector: (vector: any) => boolean;
    updateTransform: (position: any, camera: any) => void;
    normalize: (angle: any, ref: any) => any;
    readonly worldPosition: THREE.Vector3;
    scaleBasedOnDistance: (camera: any) => number;
}
export default MagneticObject;
