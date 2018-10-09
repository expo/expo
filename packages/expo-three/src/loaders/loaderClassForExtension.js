// @flow
import * as THREE from 'three';

function getExtension(uri: string): string {
  return uri
    .split('.')
    .pop()
    .split('?')[0]
    .split('#')[0];
}

export function loaderClassForUri(uri: string): ?string {
  const extension = getExtension(uri);
  console.log('ExpoTHREE.loaderClassForUri', { extension, uri });

  return loaderClassForExtension(extension);
}

export function loaderClassForExtension(extension: string): ?string {
  if (typeof extension !== 'string') {
    console.error('Supplied extension is not a valid string');
    return null;
  }
  switch (extension.toLowerCase()) {
    case '3mf':
      if (!THREE.ThreeMFLoader) require('three/examples/js/loaders/3MFLoader');
      return THREE.ThreeMFLoader;
    case 'amf':
      if (!THREE.AMFLoader) require('./AMFLoader');
      return THREE.AMFLoader;
    case 'assimp':
      if (!THREE.AssimpLoader)
        require('three/examples/js/loaders/AssimpLoader');
      return THREE.AssimpLoader;
    case 'awd':
      if (!THREE.AWDLoader) require('three/examples/js/loaders/AWDLoader');
      return THREE.AWDLoader;
    case 'babylon':
      if (!THREE.BabylonLoader)
        require('three/examples/js/loaders/BabylonLoader');
      return THREE.BabylonLoader;
    case 'bvh':
      if (!THREE.BVHLoader) require('three/examples/js/loaders/BVHLoader');
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
      if (!THREE.TDSLoader) require('three/examples/js/loaders/TDSLoader');
      return THREE.TDSLoader;
    case 'pcd':
      if (!THREE.PCDLoader) require('three/examples/js/loaders/PCDLoader');
      return THREE.PCDLoader;
    case 'ply':
      if (!THREE.PLYLoader) require('three/examples/js/loaders/PLYLoader');
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
      if (!THREE.VTKLoader) require('three/examples/js/loaders/VTKLoader');
      return THREE.VTKLoader;
    case 'x':
      if (!THREE.XLoader) require('three/examples/js/loaders/XLoader');
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
