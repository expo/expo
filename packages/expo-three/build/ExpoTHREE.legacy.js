// @flow
import { BackgroundTexture, Camera } from './AR';
import Renderer from './Renderer';
import { loadTextureAsync } from './loaders/loadModelsAsync';
export function createRenderer(props) {
    console.log('Warning: `ExpoTHREE.createRenderer(props)` is deprecated, use: `new ExpoTHREE.Renderer(props)`');
    return new Renderer(props);
}
export function renderer(props) {
    console.log('Warning: `ExpoTHREE.renderer(props)` is deprecated, use: `new ExpoTHREE.Renderer(props)`');
    return new Renderer(props);
}
export function createTextureAsync({ asset }) {
    console.log('Warning: `ExpoTHREE.createTextureAsync({ asset })` is deprecated, use: `ExpoTHREE.loadTextureAsync({ asset })`');
    return loadTextureAsync({ asset });
}
export function createARBackgroundTexture(renderer) {
    console.log('Warning: `ExpoTHREE.createARBackgroundTexture(renderer)` is deprecated, use: `new ExpoTHREE.AR.BackgroundTexture(renderer)`');
    return new BackgroundTexture(renderer);
}
export function createARCamera(arSession, width, height, zNear, zFar) {
    console.log('Warning: `ExpoTHREE.createARCamera(arSession, width, height, zNear, zFar)` is deprecated, use: `new ExpoTHREE.AR.Camera(width, height, zNear, zFar)`');
    return new Camera(width, height, zNear, zFar);
}
//# sourceMappingURL=ExpoTHREE.legacy.js.map