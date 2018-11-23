import * as THREE from 'three';
declare class CubeTexture extends THREE.CubeTexture {
    static format: {
        direct_s: string[];
        coord_s: string[];
        coord_m: string[];
    };
    loadAsync: ({ assetForDirection, directions }: {
        assetForDirection: any;
        directions: any;
    }) => Promise<void>;
}
export default CubeTexture;
