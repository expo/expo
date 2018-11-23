import * as THREE from 'three';
interface PointData {
    x: number;
    y: number;
    z: number;
    id: string;
}
interface PointsContainer {
    [key: string]: THREE.Object3D;
}
export default class Points extends THREE.Object3D {
    storedPoints: PointsContainer;
    pointsData: PointData[];
    material: THREE.PointsMaterial;
    points: PointData[];
    update: () => Promise<void>;
}
export {};
