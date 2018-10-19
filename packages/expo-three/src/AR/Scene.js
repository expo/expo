import * as THREE from 'three';

/**
 * On Android devices THREE.js implemenation of Scene is throwing with error:
 * 'TypeError: Attempted to assign to readonly property'
 * in Matrix4 creation that is part of Object3D that is being a base for Scene object
 *
 * Following code is one-to-one copy-paste from THREE.js library, but seems to work
 * Suspicion: JavaScriptCore is bugged on Android, bacause iOS work flawlessly
 */

function generateUUID() {
  return (() => {
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
    const lut = [];
    for (let i = 0; i < 256; i++) {
      lut[i] = (i < 16 ? '0' : '') + i.toString(16);
    }
    return function generateUUID() {
      const d0 = (Math.random() * 0xffffffff) | 0;
      const d1 = (Math.random() * 0xffffffff) | 0;
      const d2 = (Math.random() * 0xffffffff) | 0;
      const d3 = (Math.random() * 0xffffffff) | 0;
      const uuid = `${lut[d0 & 0xff]}${lut[(d0 >> 8) & 0xff]}${lut[(d0 >> 16) & 0xff]}${lut[(d0 >> 24) & 0xff]}-${lut[d1 & 0xff]}${lut[(d1 >> 8) & 0xff]}-${lut[((d1 >> 16) & 0x0f) | 0x40]}${lut[(d1 >> 24) & 0xff]}-${lut[(d2 & 0x3f) | 0x80]}${lut[(d2 >> 8) & 0xff]}-${lut[(d2 >> 16) & 0xff]}${lut[(d2 >> 24) & 0xff]}${lut[d3 & 0xff]}${lut[(d3 >> 8) & 0xff]}${lut[(d3 >> 16) & 0xff]}${lut[(d3 >> 24) & 0xff]}`;
      return uuid.toUpperCase();
    };
  })();
}

function Matrix4() {
  this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
Object.assign(Matrix4.prototype, THREE.Matrix4.prototype);

let object3DId = 0;
function Object3D() {
  Object.defineProperty(this, 'id', { value: object3DId++ });
  this.uuid = generateUUID();
  this.name = '';
  this.type = 'Object3D';
  this.parent = null;
  this.children = [];
  this.up = Object3D.DefaultUp.clone();
  var position = new THREE.Vector3();
  var rotation = new THREE.Euler();
  var quaternion = new THREE.Quaternion();
  var scale = new THREE.Vector3(1, 1, 1);

  function onRotationChange() {
    quaternion.setFromEuler(rotation, false);
  }

  function onQuaternionChange() {
    rotation.setFromQuaternion(quaternion, undefined, false);
  }

  rotation.onChange(onRotationChange);
  quaternion.onChange(onQuaternionChange);

  Object.defineProperties(this, {
    position: {
      enumerable: true,
      value: position,
    },
    rotation: {
      enumerable: true,
      value: rotation,
    },
    quaternion: {
      enumerable: true,
      value: quaternion,
    },
    scale: {
      enumerable: true,
      value: scale,
    },
    modelViewMatrix: {
      value: new Matrix4(),
    },
    normalMatrix: {
      value: new THREE.Matrix3(),
    },
  });

  this.matrix = new Matrix4();
  this.matrixWorld = new Matrix4();
  this.matrixAutoUpdate = Object3D.DefaultMatrixAutoUpdate;
  this.matrixWorldNeedsUpdate = false;
  this.layers = new THREE.Layers();
  this.visible = true;
  this.castShadow = false;
  this.receiveShadow = false;
  this.frustumCulled = true;
  this.renderOrder = 0;
  this.userData = {};
}
Object3D.DefaultUp = new THREE.Vector3(0, 1, 0);
Object3D.DefaultMatrixAutoUpdate = true;
Object3D.prototype = Object.assign(Object.create(THREE.Object3D.prototype));

function Scene() {
  Object3D.call(this);
  this.type = 'Scene';
  this.background = null;
  this.fog = null;
  this.overrideMaterial = null;
  this.autoUpdate = true; // checked by the renderer
}
Scene.prototype = Object.assign(Object.create(Object3D.prototype), {
  constructor: Scene,
  copy: function(source, recursive) {
    Object3D.prototype.copy.call(this, source, recursive);
    if (source.background !== null) this.background = source.background.clone();
    if (source.fog !== null) this.fog = source.fog.clone();
    if (source.overrideMaterial !== null) this.overrideMaterial = source.overrideMaterial.clone();

    this.autoUpdate = source.autoUpdate;
    this.matrixAutoUpdate = source.matrixAutoUpdate;
    return this;
  },
  toJSON: function(meta) {
    const data = Object3D.prototype.toJSON.call(this, meta);
    if (this.background !== null) data.object.background = this.background.toJSON(meta);
    if (this.fog !== null) data.object.fog = this.fog.toJSON();
    return data;
  }
});

export default Scene;
