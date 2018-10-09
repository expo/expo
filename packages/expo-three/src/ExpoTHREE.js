import '@expo/browser-polyfill';
import { YellowBox } from 'react-native';

YellowBox.ignoreWarnings([
  'THREE.WebGLRenderer: OES_texture_float_linear extension not supported.',
]);

export const AR = require('./AR');
export const Nodes = require('./Nodes');
export const utils = require('./utils');

export * from './ExpoTHREE.legacy';
export * from './loaders';

export { default as CubeTexture } from './CubeTexture';
export { default as Renderer } from './Renderer';
export { default as parseAsync } from './parseAsync';
export { default as suppressExpoWarnings } from './suppressWarnings';

export { default as loadCubeTextureAsync } from './loadCubeTextureAsync';
