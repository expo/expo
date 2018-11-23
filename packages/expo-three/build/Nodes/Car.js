/**
 * @author alteredq / http://alteredqualia.com/
 * @author evanbacon / http://github.com/evanbacon/
 */
import * as THREE from 'three';
import parseAsync from '../parseAsync';
export default function () {
    this.modelScale = 1;
    this.backWheelOffset = 2;
    this.autoWheelGeometry = true;
    this.controls = {
        forward: false,
        backward: false,
        left: false,
        right: false,
    };
    // car geometry parameters automatically set from wheel mesh
    // 	- assumes wheel mesh is front left wheel in proper global
    //    position with respect to body mesh
    //	- other wheels are mirrored against car root
    //	- if necessary back wheels can be offset manually
    this.wheelOffset = new THREE.Vector3();
    this.wheelDiameter = 1;
    // car "feel" parameters
    this.MAX_SPEED = 22.0;
    this.MAX_REVERSE_SPEED = -15.0;
    this.MAX_WHEEL_ROTATION = 0.6;
    this.FRONT_ACCELERATION = 12.5;
    this.BACK_ACCELERATION = 15.0;
    this.WHEEL_ANGULAR_ACCELERATION = 1.5;
    this.FRONT_DECCELERATION = 7.5;
    this.WHEEL_ANGULAR_DECCELERATION = 1.0;
    this.STEERING_RADIUS_RATIO = 0.23;
    this.MAX_TILT_SIDES = 0.05;
    this.MAX_TILT_FRONTBACK = 0.015;
    // internal control variables
    this.speed = 0;
    this.acceleration = 0;
    this.wheelOrientation = 0;
    this.carOrientation = 0;
    // car rigging
    this.root = new THREE.Object3D();
    this.frontLeftWheelRoot = new THREE.Object3D();
    this.frontRightWheelRoot = new THREE.Object3D();
    this.bodyMesh = null;
    this.frontLeftWheelMesh = null;
    this.frontRightWheelMesh = null;
    this.backLeftWheelMesh = null;
    this.backRightWheelMesh = null;
    // internal helper variables
    this.loaded = false;
    this.meshes = [];
    // API
    this.enableShadows = function (enable) {
        for (var i = 0; i < this.meshes.length; i++) {
            this.meshes[i].castShadow = enable;
            this.meshes[i].receiveShadow = enable;
        }
    };
    this.setVisible = function (enable) {
        for (var i = 0; i < this.meshes.length; i++) {
            this.meshes[i].visible = enable;
            this.meshes[i].visible = enable;
        }
    };
    this.loadParts = async function (bodyJson, wheelJson, assetProvider) {
        const body = await parseAsync({
            format: 'bin',
            json: bodyJson,
            assetProvider,
        });
        const wheel = await parseAsync({
            format: 'bin',
            json: wheelJson,
            assetProvider,
        });
        return await createCar({ body, wheel });
    };
    this.updateCarModel = function (delta) {
        // speed and wheels based on controls
        const { forward, backward, left, right } = this.controls;
        if (forward) {
            this.speed = THREE.Math.clamp(this.speed + delta * this.FRONT_ACCELERATION, this.MAX_REVERSE_SPEED, this.MAX_SPEED);
            this.acceleration = THREE.Math.clamp(this.acceleration + delta, -1, 1);
        }
        if (backward) {
            this.speed = THREE.Math.clamp(this.speed - delta * this.BACK_ACCELERATION, this.MAX_REVERSE_SPEED, this.MAX_SPEED);
            this.acceleration = THREE.Math.clamp(this.acceleration - delta, -1, 1);
        }
        if (left) {
            this.wheelOrientation = THREE.Math.clamp(this.wheelOrientation + delta * this.WHEEL_ANGULAR_ACCELERATION, -this.MAX_WHEEL_ROTATION, this.MAX_WHEEL_ROTATION);
        }
        if (right) {
            this.wheelOrientation = THREE.Math.clamp(this.wheelOrientation - delta * this.WHEEL_ANGULAR_ACCELERATION, -this.MAX_WHEEL_ROTATION, this.MAX_WHEEL_ROTATION);
        }
        // speed decay
        if (!(forward || backward)) {
            if (this.speed > 0) {
                var k = exponentialEaseOut(this.speed / this.MAX_SPEED);
                this.speed = THREE.Math.clamp(this.speed - k * delta * this.FRONT_DECCELERATION, 0, this.MAX_SPEED);
                this.acceleration = THREE.Math.clamp(this.acceleration - k * delta, 0, 1);
            }
            else {
                var k = exponentialEaseOut(this.speed / this.MAX_REVERSE_SPEED);
                this.speed = THREE.Math.clamp(this.speed + k * delta * this.BACK_ACCELERATION, this.MAX_REVERSE_SPEED, 0);
                this.acceleration = THREE.Math.clamp(this.acceleration + k * delta, -1, 0);
            }
        }
        // steering decay
        if (!(left || right)) {
            if (this.wheelOrientation > 0) {
                this.wheelOrientation = THREE.Math.clamp(this.wheelOrientation - delta * this.WHEEL_ANGULAR_DECCELERATION, 0, this.MAX_WHEEL_ROTATION);
            }
            else {
                this.wheelOrientation = THREE.Math.clamp(this.wheelOrientation + delta * this.WHEEL_ANGULAR_DECCELERATION, -this.MAX_WHEEL_ROTATION, 0);
            }
        }
        // car update
        var forwardDelta = this.speed * delta;
        this.carOrientation += forwardDelta * this.STEERING_RADIUS_RATIO * this.wheelOrientation;
        // displacement
        this.root.position.x += Math.sin(this.carOrientation) * forwardDelta;
        this.root.position.z += Math.cos(this.carOrientation) * forwardDelta;
        // steering
        this.root.rotation.y = this.carOrientation;
        // tilt
        if (this.loaded) {
            this.bodyMesh.rotation.z =
                this.MAX_TILT_SIDES * this.wheelOrientation * (this.speed / this.MAX_SPEED);
            this.bodyMesh.rotation.x = -this.MAX_TILT_FRONTBACK * this.acceleration;
        }
        // wheels rolling
        var angularSpeedRatio = 1 / (this.modelScale * (this.wheelDiameter / 2));
        var wheelDelta = forwardDelta;
        if (this.loaded) {
            this.frontLeftWheelMesh.rotation.x += wheelDelta;
            this.frontRightWheelMesh.rotation.x += wheelDelta;
            this.backLeftWheelMesh.rotation.x += wheelDelta;
            this.backRightWheelMesh.rotation.x += wheelDelta;
        }
        // front wheels steering
        this.frontLeftWheelRoot.rotation.y = this.wheelOrientation;
        this.frontRightWheelRoot.rotation.y = this.wheelOrientation;
    };
    // internal helper methods
    const createCar = ({ body, wheel }) => {
        // compute wheel geometry parameters
        this.body = body;
        this.wheel = wheel;
        if (this.autoWheelGeometry) {
            wheel.geometry.computeBoundingBox();
            let bb = wheel.geometry.boundingBox;
            this.wheelOffset.addVectors(bb.min, bb.max);
            this.wheelOffset.multiplyScalar(0.5);
            this.wheelDiameter = bb.max.y - bb.min.y;
            wheel.geometry.center();
        }
        // rig the car
        let delta = new THREE.Vector3();
        // body
        this.bodyMesh = new THREE.Mesh(body.geometry, body.materials);
        this.bodyMesh.scale.set(this.modelScale, this.modelScale, this.modelScale);
        this.root.add(this.bodyMesh);
        // front left wheel
        delta.multiplyVectors(this.wheelOffset, new THREE.Vector3(this.modelScale, this.modelScale, this.modelScale));
        this.frontLeftWheelRoot.position.add(delta);
        this.frontLeftWheelMesh = new THREE.Mesh(wheel.geometry, wheel.materials);
        this.frontLeftWheelMesh.scale.set(this.modelScale, this.modelScale, this.modelScale);
        this.frontLeftWheelRoot.add(this.frontLeftWheelMesh);
        this.root.add(this.frontLeftWheelRoot);
        // front right wheel
        delta.multiplyVectors(this.wheelOffset, new THREE.Vector3(-this.modelScale, this.modelScale, this.modelScale));
        this.frontRightWheelRoot.position.add(delta);
        this.frontRightWheelMesh = new THREE.Mesh(wheel.geometry, wheel.materials);
        this.frontRightWheelMesh.scale.set(this.modelScale, this.modelScale, this.modelScale);
        this.frontRightWheelMesh.rotation.z = Math.PI;
        this.frontRightWheelRoot.add(this.frontRightWheelMesh);
        this.root.add(this.frontRightWheelRoot);
        // back left wheel
        delta.multiplyVectors(this.wheelOffset, new THREE.Vector3(this.modelScale, this.modelScale, -this.modelScale));
        delta.z -= this.backWheelOffset;
        this.backLeftWheelMesh = new THREE.Mesh(wheel.geometry, wheel.materials);
        this.backLeftWheelMesh.position.add(delta);
        this.backLeftWheelMesh.scale.set(this.modelScale, this.modelScale, this.modelScale);
        this.root.add(this.backLeftWheelMesh);
        // back right wheel
        delta.multiplyVectors(this.wheelOffset, new THREE.Vector3(-this.modelScale, this.modelScale, -this.modelScale));
        delta.z -= this.backWheelOffset;
        this.backRightWheelMesh = new THREE.Mesh(wheel.geometry, wheel.materials);
        this.backRightWheelMesh.position.add(delta);
        this.backRightWheelMesh.scale.set(this.modelScale, this.modelScale, this.modelScale);
        this.backRightWheelMesh.rotation.z = Math.PI;
        this.root.add(this.backRightWheelMesh);
        this.meshes = [
            this.bodyMesh,
            this.frontLeftWheelMesh,
            this.frontRightWheelMesh,
            this.backLeftWheelMesh,
            this.backRightWheelMesh,
        ];
        this.loaded = true;
        return this;
    };
    function quadraticEaseOut(k) {
        return -k * (k - 2);
    }
    function cubicEaseOut(k) {
        return --k * k * k + 1;
    }
    function circularEaseOut(k) {
        return Math.sqrt(1 - --k * k);
    }
    function sinusoidalEaseOut(k) {
        return Math.sin((k * Math.PI) / 2);
    }
    function exponentialEaseOut(k) {
        return k === 1 ? 1 : -Math.pow(2, -10 * k) + 1;
    }
}
//# sourceMappingURL=Car.js.map