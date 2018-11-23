import * as THREE from 'three';

function getExtension(uri: string): string {
  return uri
    .split('.')
    .pop()!
    .split('?')[0]
    .split('#')[0];
}

export function loaderClassForUri(uri: string): string | null {
  const extension = getExtension(uri);
  console.log('ExpoTHREE.loaderClassForUri', { extension, uri });

  return loaderClassForExtension(extension);
}

export function loaderClassForExtension(extension: string): any | string | undefined | null {
  if (typeof extension !== 'string') {
    console.error('Supplied extension is not a valid string');
    return null;
  }
  switch (extension.toLowerCase()) {
    case '3mf':
      // @ts-ignore
      if (!THREE.ThreeMFLoader) require('three/examples/js/loaders/3MFLoader');
      // @ts-ignore
      return THREE.ThreeMFLoader;
    case 'amf':
      // @ts-ignore
      if (!THREE.AMFLoader) require('./AMFLoader');
      // @ts-ignore
      return THREE.AMFLoader;
    case 'assimp':
      // @ts-ignore
      if (!THREE.AssimpLoader)
        require('three/examples/js/loaders/AssimpLoader');
      // @ts-ignore
      return THREE.AssimpLoader;
    case 'awd':
      if (!THREE.AWDLoader) require('three/examples/js/loaders/AWDLoader');
      return THREE.AWDLoader;
    case 'babylon':
      // @ts-ignore
      if (!THREE.BabylonLoader)
        require('three/examples/js/loaders/BabylonLoader');
      // @ts-ignore
      return THREE.BabylonLoader;
    case 'bvh':
      // @ts-ignore   
      if (!THREE.BVHLoader) require('three/examples/js/loaders/BVHLoader');
      // @ts-ignore
      return THREE.BVHLoader;
    case 'ctm':
      if (!THREE.CTMLoader) {
        require('three/examples/js/loaders/ctm/lzma');
        require('three/examples/js/loaders/ctm/ctm');
        require('three/examples/js/loaders/ctm/CTMLoader');
      }
      return THREE.CTMLoader;
    case 'max':
    case '3ds':
      // @ts-ignore 
      if (!THREE.TDSLoader) require('three/examples/js/loaders/TDSLoader');
      // @ts-ignore
      return THREE.TDSLoader;
    case 'pcd':
      // @ts-ignore
      if (!THREE.PCDLoader) require('three/examples/js/loaders/PCDLoader');
      // @ts-ignore
      return THREE.PCDLoader;
    case 'ply':
      // @ts-ignore
      if (!THREE.PLYLoader) require('three/examples/js/loaders/PLYLoader');
      // @ts-ignore
      return THREE.PLYLoader;
    case 'obj':
      if (!THREE.OBJLoader) require('three/examples/js/loaders/OBJLoader');
      return THREE.OBJLoader;
    case 'mtl':
      if (!THREE.MTLLoader) require('three/examples/js/loaders/MTLLoader');
      return THREE.MTLLoader;
    case 'dae':
      if (!THREE.ColladaLoader)
        require('three/examples/js/loaders/ColladaLoader');
      return THREE.ColladaLoader;
    case 'stl':
      if (!THREE.STLLoader) require('three/examples/js/loaders/STLLoader');
      return THREE.STLLoader;
    case 'vtk':
    case 'vtp':
      // @ts-ignore
      if (!THREE.VTKLoader) require('three/examples/js/loaders/VTKLoader');
      // @ts-ignore
      return THREE.VTKLoader;
    case 'x':
      // @ts-ignore
      if (!THREE.XLoader) require('three/examples/js/loaders/XLoader');
      // @ts-ignore
      return THREE.XLoader;
    // case 'drc':
    //   if (!THREE.DRACOLoader) require('three/examples/js/loaders/draco/DRACOLoader');
    //   return THREE.DRACOLoader;
    default:
      console.error(
        'ExpoTHREE.loaderClassForExtension(): Unrecognized file type',
        extension
      );
      break;
  }
}
