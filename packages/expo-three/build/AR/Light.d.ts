import * as THREE from 'three';
declare class Light extends THREE.PointLight {
    constructor();
    _data: {};
    data: any;
    update: () => Promise<void>;
}
export default Light;
