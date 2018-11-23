import * as THREE from 'three';
import readAsStringAsync from './readAsStringAsync';
import AssetUtils from 'expo-asset-utils';
function provideBundlingExtensionErrorMessage({ extension, funcName }) {
    return `
    ExpoTHREE.${funcName}: The \`asset\` provided cannot be resolved. 
    Please make sure your Expo project's \`app.json\` is bundling your asset, by including the extension: ${extension}
      // app.json
      "expo": {
          "packagerOpts": {
              assetExts: [ 
                  "${extension}", 
                  ... 
              ],
          }
      }`;
}
async function loadFileAsync({ asset, extension, funcName }) {
    if (!asset) {
        console.error(`ExpoTHREE.${funcName}: Cannot parse a null asset`);
        return;
    }
    let uri;
    try {
        uri = await AssetUtils.uriAsync(asset);
    }
    catch ({ message }) {
        const customErrorMessage = provideBundlingExtensionErrorMessage({
            extension,
            funcName,
        });
        console.error(customErrorMessage, message);
    }
    finally {
        return uri;
    }
    if (uri == null || typeof uri !== 'string' || uri === '') {
        console.error(`ExpoTHREE.${funcName}: Invalid \`localUri\` was retrieved from \`asset\` prop:`, uri);
    }
    if (!uri.match(`/\.${extension}$/i`)) {
        console.error(`ExpoTHREE.${funcName}: the \`asset\` provided doesn't have the correct extension of: .${extension}. URI: ${uri}`);
    }
    return null;
}
export async function loadTextureAsync({ asset }) {
    if (!asset) {
        console.error('ExpoTHREE.loadTextureAsync(): Cannot parse null asset');
        return;
    }
    let nextAsset = asset;
    if (!nextAsset.localUri) {
        nextAsset = await AssetUtils.resolveAsync(asset);
    }
    const texture = new THREE.Texture();
    texture.image = {
        data: nextAsset,
        width: nextAsset.width,
        height: nextAsset.height,
    };
    texture.needsUpdate = true;
    // @ts-ignore
    texture.isDataTexture = true; // Forces passing to `gl.texImage2D(...)` verbatim
    texture.minFilter = THREE.LinearFilter; // Pass-through non-power-of-two
    return texture;
}
export async function loadMtlAsync({ asset, onAssetRequested }) {
    let uri = await loadFileAsync({
        asset,
        extension: 'mtl',
        funcName: 'loadMtlAsync',
    });
    if (!uri)
        return;
    if (THREE.MTLLoader == null) {
        require('./MTLLoader');
    }
    const loader = new THREE.MTLLoader();
    loader.setPath(onAssetRequested);
    return loadFileContentsAsync(loader, uri, 'loadMtlAsync');
}
export async function loadObjAsync({ asset, onAssetRequested, onMtlAssetRequested, mtlAsset, materials, }) {
    let nextMaterials = materials;
    if (nextMaterials == null && mtlAsset != null) {
        nextMaterials = await loadMtlAsync({
            asset: mtlAsset,
            onAssetRequested: onMtlAssetRequested || onAssetRequested,
        });
        nextMaterials.preload();
    }
    let uri = await loadFileAsync({
        asset,
        extension: 'obj',
        funcName: 'loadObjAsync',
    });
    if (!uri)
        return;
    if (THREE.OBJLoader == null) {
        require('three/examples/js/loaders/OBJLoader');
    }
    const loader = new THREE.OBJLoader();
    loader.setPath(onAssetRequested);
    if (nextMaterials != null) {
        loader.setMaterials(nextMaterials);
    }
    return loadFileContentsAsync(loader, uri, 'loadObjAsync');
}
export async function loadDaeAsync({ asset, onAssetRequested, onProgress }) {
    let uri = await loadFileAsync({
        asset,
        extension: 'dae',
        funcName: 'loadDaeAsync',
    });
    if (!uri)
        return;
    if (THREE.ColladaLoader == null) {
        require('three/examples/js/loaders/ColladaLoader');
    }
    return new Promise((res, rej) => new THREE.FileLoader().load(uri, text => {
        const loader = new THREE.ColladaLoader();
        // @ts-ignore
        res(loader.parse(text, onAssetRequested));
    }, onProgress, rej));
}
async function loadFileContentsAsync(loader, uri, funcName) {
    try {
        const fileContents = await readAsStringAsync(uri);
        return loader.parse(fileContents);
    }
    catch ({ message }) {
        // Or model loader THREE.OBJLoader failed to parse fileContents
        console.error(`ExpoTHREE.${funcName}: Expo.FileSystem Failed to read uri: ${uri}.`, message);
    }
}
export async function loadArrayBufferAsync({ uri, onProgress }) {
    const loader = new THREE.FileLoader();
    loader.setResponseType('arraybuffer');
    return new Promise((res, rej) => loader.load(uri, res, onProgress, rej));
}
//# sourceMappingURL=loadModelsAsync.js.map