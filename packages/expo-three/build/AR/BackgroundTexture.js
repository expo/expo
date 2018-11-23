import * as THREE from 'three';
import * as AR from 'expo-ar';
export default class BackgroundTexture extends THREE.Texture {
    constructor(renderer) {
        super();
        this.initCameraTexture = async (renderer) => {
            const cameraTexture = await AR.getCameraTextureAsync();
            const properties = renderer.properties.get(this);
            properties.__webglInit = true;
            properties.__webglTexture = cameraTexture;
        };
        this.initCameraTexture(renderer);
    }
}
//# sourceMappingURL=BackgroundTexture.js.map