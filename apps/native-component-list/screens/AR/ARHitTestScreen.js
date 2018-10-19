import React from 'react';
import { AR, Permissions } from 'expo';
import * as ExpoTHREE from 'expo-three';
import * as THREE from 'three';

import { TouchableView, PermissionsRequester } from './components';

ExpoTHREE.suppressExpoWarnings();

export default class ARHitTestScreen extends React.Component {
  static title = 'AR HitTest';

  render() {
    return (
      <PermissionsRequester permissionsTypes={[Permissions.CAMERA]}>
        <TouchableView
          style={{ flex: 1 }}
          shouldCancelWhenOutside={false}
          onTouchesBegan={this.onTouchesBegan}>
          <AR.ARView
            style={{ flex: 1 }}
            onContextCreate={this.onContextCreate}
            onRender={this.onRender}
            onResize={this.onResize}
          />
        </TouchableView>
      </PermissionsRequester>
    );
  }
  onContextCreate = async event => {
    this.commonSetup(event);
  };

  commonSetup = ({ gl, scale, width, height }) => {
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio: scale,
      width,
      height,
      clearColor: 0xfffc00,
    });

    this.scene = new ExpoTHREE.AR.Scene();
    this.scene.background = new ExpoTHREE.AR.BackgroundTexture(this.renderer);
    this.camera = new ExpoTHREE.AR.Camera(width, height, 0.01, 1000);
    this.gl = gl;
  };

  onResize = ({ x, y, scale, width, height }) => {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  onRender = () => {
    this.renderer.render(this.scene, this.camera);
    this.gl.finish();
  };

  onTouchesBegan = async ({ locationX: x, locationY: y }) => {
    if (!this.renderer) {
      return;
    }

    const size = this.renderer.getSize();
    console.log('touch', { x, y, ...size });

    const hitTest = await AR.performHitTestAsync(
      { x: x / size.width, y: y / size.height },
      AR.HitTestResultType.HorizontalPlane
    );

    console.log(hitTest);

    for (const { worldTransform } of hitTest) {
      if (this.cube) {
        this.scene.remove(this.cube);
      }

      const geometry = new THREE.BoxGeometry(0.0254, 0.0254, 0.0254);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
      });
      this.cube = new THREE.Mesh(geometry, material);
      this.scene.add(this.cube);

      this.cube.matrixAutoUpdate = false;

      const matrix = new THREE.Matrix4();
      matrix.fromArray(worldTransform);

      this.cube.applyMatrix(matrix);
      this.cube.updateMatrix();
    }
  };
}
