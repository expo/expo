// @flow
import * as THREE from 'three';
import AssetUtils from 'expo-asset-utils';

import resolveAsset from '../resolveAsset';
import parseAssetCallback from './parseAssetCallback';
import readAsStringAsync from './readAsStringAsync';

import {
  loadDaeAsync,
  loadObjAsync,
  loadMtlAsync,
  loadTextureAsync,
  loadArrayBufferAsync,
} from './loadModelsAsync';

import {
  loaderClassForExtension,
  loaderClassForUri,
} from './loaderClassForExtension';

export async function loadBasicModelAsync({
  uri,
  onProgress,
  onAssetRequested,
  loader,
  LoaderClass,
}) {
  const _loader = loader || new LoaderClass();
  if (_loader.setPath) _loader.setPath(onAssetRequested);
  return new Promise((res, rej) => _loader.load(uri, res, onProgress, rej));
}

export default (loadAsync = async (res, onProgress, onAssetRequested) => {
  let urls = await resolveAsset(res);
  if (!urls) {
    console.error(
      `ExpoTHREE.loadAsync: Cannot parse undefined assets. Please pass valid resources for: ${res}.`
    );
    return;
  }
  const asset = urls[0];
  let url = await AssetUtils.uriAsync(asset);

  if (!url) {
    console.error(
      `ExpoTHREE.loadAsync: this asset couldn't be downloaded. Be sure that your app.json contains the correct extensions.`
    );
  }

  if (urls.length == 1) {
    if (url.match(/\.(jpeg|jpg|gif|png)$/)) {
      return loadTextureAsync({ asset });
    } else if (url.match(/\.assimp$/i)) {
      const arrayBuffer = await loadArrayBufferAsync({ uri: url, onProgress });
      const AssimpLoader = loaderClassForExtension('assimp');
      const loader = new AssimpLoader();
      return loader.parse(arrayBuffer, onAssetRequested);
    } else if (url.match(/\.dae$/i)) {
      return loadDaeAsync({
        asset: url,
        onProgress,
        onAssetRequested,
      });
    } else if (url.match(/\.x$/i)) {
      const XLoader = loaderClassForExtension('x');

      const texLoader = {
        path: onAssetRequested,
        load: loadTexture,
      };
      const loader = new XLoader(undefined, texLoader);
      return new Promise((res, rej) =>
        loader.load([url, false], res, onProgress, rej)
      );
    } else if (url.match(/\.json$/i)) {
      console.error(
        'loadAsync: Please use ExpoTHREE.parseAsync({json}) instead, json can be loaded in lots of different ways.'
      );
      return;
    } else if (url.match(/\.obj$/i)) {
      return loadObjAsync({ asset: url, onAssetRequested });
    } else if (url.match(/\.mtl$/i)) {
      return loadMtlAsync({ asset: url, onAssetRequested });
    } else {
      const LoaderClass = loaderClassForUri(url);
      return loadBasicModelAsync({
        uri: url,
        onProgress,
        onAssetRequested,
        LoaderClass,
      });
    }
  } else if (urls.length === 2) {
    let urlB = await stringFromAsset(urls[1]);
    if (url.match(/\.mtl$/i) && urlB.match(/\.obj$/i)) {
      return loadObjAsync({
        asset: urlB,
        mtlAsset: url,
        onAssetRequested,
      });
    } else if (url.match(/\.obj$/i) && urlB.match(/\.mtl$/i)) {
      return loadObjAsync({
        asset: url,
        mtlAsset: urlB,
        onAssetRequested,
      });
    } else {
      console.error('Unrecognized File Type', url);
    }
  } else {
    console.error('Too many arguments passed', urls);
    return;
  }
});

const loadTexture = function(url, onLoad, onProgress, onError) {
  const texture = new THREE.Texture();
  if (
    typeof this.path === 'function' ||
    (this.path !== null && typeof this.path === 'object')
  ) {
    (async () => {
      url = url.split('/').pop();
      const asset = await parseAssetCallback(url, this.path);
      const { minFilter, image } = await loadTextureAsync({ asset });
      texture.image = image;
      texture.needsUpdate = true;
      texture.isDataTexture = true; // Forces passing to `gl.texImage2D(...)` verbatim
      texture.minFilter = minFilter; // Pass-through non-power-of-two

      if (onLoad !== undefined) {
        console.warn('loaded tex', texture);
        onLoad(texture);
      }
    })();
  }

  return texture;
};

/*
  **Super Hack:**
  Override Texture Loader to use the `path` component as a callback to get resources or Expo `Asset`s
*/

THREE.TextureLoader.prototype.load = loadTexture;
