const THREE = require('three');

class Renderer extends THREE.WebGLRenderer {
  constructor({ gl, canvas, pixelRatio, clearColor, width, height, ...props }) {
    width = width || gl.drawingBufferWidth;
    height = height || gl.drawingBufferHeight;
    super({
      canvas: canvas || {
        width,
        height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: height,
      },
      context: gl,
      ...props,
    });

    this.setPixelRatio(pixelRatio || 1);

    if (width && height) this.setSize(width, height);
    if (clearColor) this.setClearColor(clearColor, 1.0);
  }
}

const loadAsync = res => {
  let nextRes = res;
  if (typeof res === 'object' && res !== null && res.downloadAsync) {
    nextRes = res.localUri || res.uri;
  }
  return new THREE.TextureLoader().load(nextRes);
};

export default { Renderer, loadAsync };
