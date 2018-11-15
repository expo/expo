import { AR } from 'expo-ar';
import * as THREE from 'three';

export default class Planes extends THREE.Object3D {
  storedPlanes = {};
  planesData = [];
  segments = 5;
  defaultRotationX = -Math.PI * 0.5;

  planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    wireframe: true,
  });

  get planes() {
    return this.storedPlanes;
  }

  set planes(newPlanesData) {
    this.planesData = newPlanesData;
    const newPlanes = {};

    newPlanesData.forEach(
      ({ center: { x, z }, extent: { width, length }, transform, id }) => {
        let planeObject = this.storedPlanes[id];
        if (planeObject) {
          // plane already exists
          delete this.storedPlanes[id]; // remove plane from orginal container
        } else {
          // no such plane - create one
          const geometry = new THREE.PlaneBufferGeometry(
            width,
            length,
            this.segments,
            this.segments
          );
          const planeMesh = new THREE.Mesh(geometry, this.planeMaterial);
          planeMesh.rotation.x = this.defaultRotationX;

          planeObject = new THREE.Object3D();
          planeObject.planeMesh = planeMesh;
          planeObject.add(planeMesh);
          this.add(planeObject);
        }

        // store plane
        newPlanes[id] = planeObject;

        // update plane properties
        planeObject.planeMesh.position.x = x;
        planeObject.planeMesh.position.z = z;

        planeObject.planeMesh.geometry.width = width;
        planeObject.planeMesh.geometry.height = length;

        planeObject.matrix.fromArray(transform);
        planeObject.matrix.decompose(
          planeObject.position,
          planeObject.quaternion,
          planeObject.scale
        );
      }
    );

    // remove old planes from THREE
    Object.entries(this.storedPlanes).forEach(([_, plane]) =>
      this.remove(plane)
    );
    this.storedPlanes = newPlanes;
  }

  update = async () => {
    const {
      [AR.FrameAttribute.Planes]: planes,
    } = await AR.getCurrentFrameAsync({
      [AR.FrameAttribute.Planes]: true,
    });
    this.planes = planes;
  };
}
