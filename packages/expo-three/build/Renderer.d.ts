import * as THREE from 'three';
export default class Renderer extends THREE.WebGLRenderer {
    constructor({ gl, canvas, pixelRatio, clearColor, width, height, ...props }: {
        [x: string]: any;
        gl: any;
        canvas: any;
        pixelRatio: any;
        clearColor: any;
        width: any;
        height: any;
    });
}
