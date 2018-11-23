import * as AR from 'expo-ar';
import * as THREE from 'three';

interface PointData {
  x: number;
  y: number;
  z: number;
  id: string;
};

interface PointsContainer {
  [key: string]: THREE.Object3D;
};

export default class Points extends THREE.Object3D {
  storedPoints: PointsContainer = {};
  pointsData: PointData[] = [];
  material = new THREE.PointsMaterial({
    size: 20,
    sizeAttenuation: false,
    color: 0xff00ff,
  });

  get points() {
    return this.pointsData;
  }

  set points(newPointsData) {
    this.pointsData = newPointsData;
    const newPoints = {};

    newPointsData.forEach(({ x, y, z, id }) => {
      let pointObject = this.storedPoints[id];
      if (pointObject) {
        // point already exists
        delete this.storedPoints[id]; // remove point from orginal container
      } else {
        // no such point - create one
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        pointObject = new THREE.Points(geometry, this.material);
        this.add(pointObject);
      }
      // store point
      newPoints[id] = pointObject;
      // update position of pointObject
      pointObject.position.set(x, y, z);
    });

    // remove old points from THREE
    Object.entries(this.storedPoints).forEach(([_, point]) =>
      this.remove(point)
    );
    this.storedPoints = newPoints;
  }

  update = async () => {
    const {
      [AR.FrameAttribute.RawFeaturePoints]: points,
    } = await AR.getCurrentFrameAsync({
      [AR.FrameAttribute.RawFeaturePoints]: true,
    });

    this.points = points || [];
  };
}
