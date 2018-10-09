import * as THREE from 'three';
import {
  positionFromTransform,
  worldPositionFromScreenPosition,
} from './calculations';

//TODO: Evan: Vertical support

class MagneticObject extends THREE.Object3D {
  // use average of recent positions to avoid jitter
  recentMagneticPositions = [];
  anchorsOfVisitedPlanes = [];

  maintainScale = true;
  maintainRotation = true;

  constructor() {
    super();
    // this.visible = false;
    this.recentMagneticPositions = [];
    this.anchorsOfVisitedPlanes = [];
  }

  updateForAnchor = (position, planeAnchor, camera) => {
    if (planeAnchor != null) {
      const index = this.anchorsOfVisitedPlanes.indexOf(planeAnchor);
      this.anchorsOfVisitedPlanes.unshift(planeAnchor);
      // TODO: Move in direction
      // this.visible = false;
    } else {
      // this.visible = true;
    }
    this.updateTransform(position, camera);
  };

  update = (camera, screenPosition) => {
    const { worldPosition, planeAnchor } = worldPositionFromScreenPosition(
      camera,
      screenPosition,
      this.position
    );
    if (worldPosition) {
      this.updateForAnchor(worldPosition, planeAnchor, camera);
    }
  };

  isValidVector = vector =>
    vector && !isNaN(vector.x) && !isNaN(vector.y) && !isNaN(vector.z);

  updateTransform = (position, camera) => {
    if (!this.isValidVector(position)) {
      return;
    }
    // add to list of recent positions
    this.recentMagneticPositions.push(position);

    // remove anything older than the last 8
    while (this.recentMagneticPositions.length > 8) {
      this.recentMagneticPositions.shift();
    }

    // move to average of recent positions to avoid jitter

    if (this.recentMagneticPositions.length > 4) {
      const { length } = this.recentMagneticPositions;
      let average = new THREE.Vector3();

      for (let position of this.recentMagneticPositions) {
        average.add(position);
      }
      average.divide(new THREE.Vector3(length, length, length));
      this.position.set(average.x, average.y, average.z);

      if (this.maintainScale) {
        const scale = this.scaleBasedOnDistance(camera);
        this.scale.set(scale, scale, scale);
      } else {
        this.scale.set(1, 1, 1);
      }
    }

    if (this.maintainRotation) {
      // Correct y rotation of camera square
      if (camera) {
        let cameraQuaternion = new THREE.Quaternion();
        camera.getWorldQuaternion(cameraQuaternion);

        let cameraEuler = new THREE.Euler();
        cameraEuler.setFromQuaternion(cameraQuaternion, 'YZX');

        const tilt = Math.abs(cameraEuler.x);
        const threshold1 = (Math.PI / 2) * 0.65;
        const threshold2 = (Math.PI / 2) * 0.75;
        const yaw = Math.atan2(
          camera.matrixWorld.elements[0],
          camera.matrixWorld.elements[1]
        );
        let angle = 0;

        if (tilt >= 0 || tilt < threshold1) {
          angle = cameraEuler.y;
        } else if (tilt >= threshold1 || tilt < threshold2) {
          const relativeInRange = Math.abs(
            (tilt - threshold1) / (threshold2 - threshold1)
          );
          const normalizedY = this.normalize(cameraEuler.y, yaw);
          angle = normalizedY * (1 - relativeInRange) + yaw * relativeInRange;
        } else {
          angle = yaw;
        }
        this.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      }
    }
  };

  normalize = (angle, ref) => {
    // Normalize angle in steps of 90 degrees such that the rotation to the other angle is minimal
    let normalized = angle;
    while (Math.abs(normalized - ref) > Math.PI / 4) {
      if (angle > ref) {
        normalized -= Math.PI / 2;
      } else {
        normalized += Math.PI / 2;
      }
    }
    return normalized;
  };

  get worldPosition() {
    let worldPosition = new THREE.Vector3();
    this.getWorldPosition(worldPosition);
    return worldPosition;
  }

  scaleBasedOnDistance = camera => {
    if (camera) {
      const cameraPosition = positionFromTransform(camera.matrixWorld);

      const delta = this.position.clone().sub(cameraPosition);
      let distanceFromCamera = delta.length();
      // console.log('distanceFromCamera', cameraPosition, this.position, distanceFromCamera);

      // From Apple:
      // Reduce size changes of the node based on the distance by scaling it up if it is far away,
      // and down if it is very close.
      // The values are adjusted such that scale will be 1 in 0.7 m distance (estimated distance when looking at a table),
      // and 1.2 in 1.5 m distance (estimated distance when looking at the floor).
      let newScale =
        distanceFromCamera < 0.7
          ? distanceFromCamera / 0.7
          : 0.25 * distanceFromCamera + 0.825;

      return newScale;
    }
    return 1.0;
  };
}

export default MagneticObject;
