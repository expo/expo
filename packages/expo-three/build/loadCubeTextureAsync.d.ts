import CubeTexture from './CubeTexture';
declare function loadCubeTextureAsync({ assetForDirection, directions }: {
    assetForDirection: any;
    directions: any;
}): Promise<CubeTexture>;
export default loadCubeTextureAsync;
