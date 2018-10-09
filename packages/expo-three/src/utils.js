// @flow

import * as THREE from 'three';

export function alignMesh(mesh: THREE.Mesh, axis = { x: 0.5, y: 0.5, z: 0.5 }) {
  axis = axis || {};
  const box = new THREE.Box3().setFromObject(mesh);

  let size = new THREE.Vector3();
  box.getSize(size);
  const min = { x: -box.min.x, y: -box.min.y, z: -box.min.z };

  Object.keys(axis).map(key => {
    const scale = axis[key];
    mesh.position[key] = min[key] - size[key] + size[key] * scale;
  });
}

export function scaleLongestSideToSize(mesh: THREE.Mesh, size: number) {
  let sizedVector = new THREE.Vector3();
  new THREE.Box3().setFromObject(mesh).getSize(sizedVector);

  const { x: width, y: height, z: depth } = sizedVector;

  const longest = Math.max(width, Math.max(height, depth));
  const scale = size / longest;
  mesh.scale.set(scale, scale, scale);
}

// Used for smoothing imported meshes
export function computeMeshNormals(mesh: THREE.Mesh) {
  mesh.traverse(async child => {
    if (child instanceof THREE.Mesh) {
      /// Smooth geometry
      const temp = new THREE.Geometry().fromBufferGeometry(child.geometry);
      temp.mergeVertices();
      temp.computeVertexNormals();
      temp.computeFaceNormals();

      child.geometry = new THREE.BufferGeometry().fromGeometry(temp);
    }
  });
}
