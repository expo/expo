import * as THREE from 'three';
export declare function alignMesh(mesh: THREE.Mesh, axis?: {
    x: number;
    y: number;
    z: number;
}): void;
export declare function scaleLongestSideToSize(mesh: THREE.Mesh, size: number): void;
export declare function computeMeshNormals(mesh: THREE.Mesh): void;
