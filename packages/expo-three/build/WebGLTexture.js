import * as THREE from 'three';
export default class WebGLTexture extends THREE.Texture {
    constructor(renderer, webGLTexture) {
        super();
        const properties = renderer.properties.get(this);
        properties.__webglInit = true;
        properties.__webglTexture = webGLTexture;
    }
}
//# sourceMappingURL=WebGLTexture.js.map