import CubeTexture from './CubeTexture';

async function loadCubeTextureAsync({ assetForDirection, directions }) {
  const texture = new CubeTexture();
  await texture.loadAsync({ assetForDirection, directions });
  return texture;
}

export default loadCubeTextureAsync;
