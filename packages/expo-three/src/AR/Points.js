import { AR } from 'expo-ar';
import * as THREE from 'three';

class Points extends THREE.Object3D {
  common = {};
  _data = {};
  material = new THREE.PointsMaterial({ size: 5, sizeAttenuation: false });

  get data() {
    return this._data;
  }

  set data(points) {
    this._data = points;
    let nextPoints = {};

    for (let point of points) {
      const { x, y, z, id } = point;
      let object = this.common[id];
      nextPoints[id] = object;
      this.common[id] = null;
      if (!object) {
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        object = new THREE.Points(geometry, this.material);
        nextPoints[id] = object;
        this.add(object);
      }
      object.position.set(x, y, z);
    }

    for (let key in this.common) {
      this.remove(this.common[key]);
    }
    this.common = nextPoints;
  }

  update = async () => {
    const { rawFeaturePoints } = await AR.getCurrentFrameAsync({
      [AR.FrameAttribute.RawFeaturePoints]: true,
    });
    this.data = rawFeaturePoints;
  };
}

export default Points;
