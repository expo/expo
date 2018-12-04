import * as AR from 'expo-ar';
import * as THREE from 'three';
interface PlanesContainer {
    [key: number]: THREE.Object3D;
}
export default class Planes extends THREE.Object3D {
    storedPlanes: PlanesContainer;
    planesData: AR.Plane[];
    segments: number;
    defaultRotationX: number;
    planeMaterial: THREE.MeshBasicMaterial;
    planes: AR.Plane[];
    update: () => Promise<void>;
}
export {};
