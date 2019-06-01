import * as THREE from 'three';
import { Asset } from 'expo-asset';

class Renderer extends THREE.WebGLRenderer {
  constructor({
    gl,
    canvas,
    pixelRatio,
    clearColor,
    width,
    height,
    ...props
  }: {
    gl: WebGLRenderingContext;
    canvas: any;
    pixelRatio: number;
    clearColor: number;
    width: number;
    height: number;
  }) {
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

const loadAsync = (res?: Asset | string) => {
  let nextRes: Asset | string | undefined = res;
  if (res && typeof res === 'object' && res.downloadAsync) {
    nextRes = res.localUri || res.uri;
  }
  return new THREE.TextureLoader().load(nextRes as string);
};

export default { Renderer, loadAsync };
