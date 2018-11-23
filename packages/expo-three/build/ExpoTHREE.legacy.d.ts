import * as THREE from 'three';
import { BackgroundTexture, Camera } from './AR';
import Renderer from './Renderer';
export declare function createRenderer(props: any): Renderer;
export declare function renderer(props: any): Renderer;
export declare function createTextureAsync({ asset }: {
    asset: any;
}): Promise<THREE.Texture | undefined>;
export declare function createARBackgroundTexture(renderer: THREE.WebGLRenderer): BackgroundTexture;
export declare function createARCamera(arSession: any, width: any, height: any, zNear: any, zFar: any): Camera;
