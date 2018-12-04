import * as AR from 'expo-ar';
import * as THREE from 'three';
declare class Light extends THREE.PointLight {
    constructor();
    lightData?: AR.LightEstimation;
    light: AR.LightEstimation;
    update: () => Promise<void>;
}
export default Light;
