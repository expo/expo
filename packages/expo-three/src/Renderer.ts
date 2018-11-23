import * as THREE from 'three';

export default class Renderer extends THREE.WebGLRenderer {
  constructor({ gl, canvas, pixelRatio, clearColor, width, height, ...props }) {
    super({
      canvas: canvas || {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: gl.drawingBufferHeight,
      },
      context: gl,
      ...props,
    });

    this.setPixelRatio(pixelRatio || 1);

    if (width && height) {
      this.setSize(width, height);
    }
    if (clearColor) {
      this.setClearColor(clearColor, 1.0);
    }
  }
}
