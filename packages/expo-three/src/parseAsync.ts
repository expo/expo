import * as THREE from 'three';
import resolveAsset, { stringFromAsset } from './resolveAsset';

declare module 'THREE' {
  class BinaryLoader extends THREE.Loader {}
}

async function loadBinAsync(binLocalUrl) {
  const bufferLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
  bufferLoader.setResponseType('arraybuffer');
  return new Promise((res, rej) => bufferLoader.load(binLocalUrl, res, () => {}, rej));
}

async function parseBinAsync({ json, assetProvider }) {
  const { buffers, materials } = json;
  if (!buffers) {
    console.error(
      `ExpoTHREE.parseAsync: Invalid json! The json file must contain a "buffers" key.`
    );
    return;
  }
  const bin = await assetProvider(buffers);
  if (bin === undefined) {
    console.error(
      `ExpoTHREE.parseAsync: Cannot parse undefined .bin. Using the assetProvider you must pass a valid reference for: ${buffers}.`
    );
    return;
  }
  const assets = await resolveAsset(bin);
  const binLocalUrl = await stringFromAsset(assets[0]);
  const arrayBuffer = await loadBinAsync(binLocalUrl);

  // TODO: bbarthec BinaryLoader is no longer available
  // require('three/examples/js/loaders/BinaryLoader');
  const loader = new THREE.BinaryLoader() as any;
  loader.setPath && loader.setPath(assetProvider);
  return new Promise((res, rej) =>
    loader.parse(
      arrayBuffer,
      geometry => res({ geometry, materials }),
      '', //This is probs wrong
      materials
    )
  );
}

async function parseWithLoaderAsync({ json, assetProvider, loader }) {
  loader.setPath && loader.setPath(assetProvider);
  return loader.parse(json, assetProvider);
}

const parseAsync = async ({ json, format, assetProvider }) => {
  if (!format) {
    format = solveFormat(json);
  }

  switch (format) {
    case 'bin':
      return parseBinAsync({ json, assetProvider });
    case 'clara':
    case 'object':
      return parseWithLoaderAsync({
        json,
        assetProvider,
        loader: new THREE.ObjectLoader(),
      });
    case 'json':
    case 'blender':
      return parseWithLoaderAsync({
        json,
        assetProvider,
        loader: new THREE.JSONLoader(),
      });
    case 'buffer':
      return parseWithLoaderAsync({
        json,
        assetProvider,
        loader: new THREE.BufferGeometryLoader(),
      });
    case 'scene':
    default:
      console.error(`ExpoTHREE.parseAsync: ${format} not supported yet! Tell someone to fix it :}`);
      break;
  }
};

export default parseAsync;

function solveFormat({ metadata }) {
  if (metadata !== undefined) {
    const { type } = metadata;
    if (type !== undefined) {
      return type;
    }
  }
}
