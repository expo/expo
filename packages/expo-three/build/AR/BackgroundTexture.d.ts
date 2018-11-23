import * as THREE from 'three';
export default class BackgroundTexture extends THREE.Texture {
    constructor(renderer: THREE.WebGLRenderer);
    initCameraTexture: (renderer: any) => Promise<void>;
}
