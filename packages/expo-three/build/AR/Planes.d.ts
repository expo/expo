import * as THREE from 'three';
declare type Matrix4x4 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
interface PlaneData {
    extent: {
        width: number;
        length: number;
    };
    worldTransform: Matrix4x4;
    id: number;
}
interface PlanesContainer {
    [key: number]: THREE.Object3D;
}
export default class Planes extends THREE.Object3D {
    storedPlanes: PlanesContainer;
    planesData: PlaneData[];
    segments: number;
    defaultRotationX: number;
    planeMaterial: THREE.MeshBasicMaterial;
    planes: PlaneData[];
    update: () => Promise<void>;
}
export {};
