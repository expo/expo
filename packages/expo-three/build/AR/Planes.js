import * as AR from 'expo-ar';
import * as THREE from 'three';
;
;
export default class Planes extends THREE.Object3D {
    constructor() {
        super(...arguments);
        this.storedPlanes = {};
        this.planesData = [];
        this.segments = 5;
        this.defaultRotationX = -Math.PI * 0.5;
        this.planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
        });
        this.update = async () => {
            const { [AR.FrameAttribute.Planes]: planes, } = await AR.getCurrentFrameAsync({
                [AR.FrameAttribute.Planes]: true,
            });
            this.planes = planes || [];
        };
    }
    get planes() {
        return this.planesData;
    }
    set planes(newPlanesData) {
        this.planesData = newPlanesData;
        const newPlanes = {};
        newPlanesData.forEach(({ extent: { width, length }, transformWorld, id }) => {
            let planeObject = this.storedPlanes[id];
            if (planeObject) {
                // plane already exists
                delete this.storedPlanes[id]; // remove plane from orginal container
            }
            else {
                // no such plane - create one
                const geometry = new THREE.PlaneBufferGeometry(width, length, this.segments, this.segments);
                const planeMesh = new THREE.Mesh(geometry, this.planeMaterial);
                planeMesh.rotation.x = this.defaultRotationX;
                planeObject = new THREE.Object3D();
                // @ts-ignore
                planeObject.planeMesh = planeMesh;
                planeObject.add(planeMesh);
                this.add(planeObject);
            }
            // store plane
            newPlanes[id] = planeObject;
            // @ts-ignore
            planeObject.planeMesh.geometry.width = width;
            // @ts-ignore
            planeObject.planeMesh.geometry.height = length;
            planeObject.matrix.fromArray(transformWorld);
            planeObject.matrix.decompose(planeObject.position, planeObject.quaternion, planeObject.scale);
        });
        // remove old planes from THREE
        Object.entries(this.storedPlanes).forEach(([_, plane]) => this.remove(plane));
        this.storedPlanes = newPlanes;
    }
}
//# sourceMappingURL=Planes.js.map