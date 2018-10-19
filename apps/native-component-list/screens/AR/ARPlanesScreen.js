import React from 'react';
import { AR, Permissions } from 'expo';
import * as ExpoTHREE from 'expo-three';
import * as THREE from 'three';

import { PermissionsRequester } from './components';

export default class App extends React.Component {
  static title = 'AR Planes';

  render() {
    return (
      <PermissionsRequester permissionsTypes={[Permissions.CAMERA]}>
        <AR.ARView
          style={{ flex: 1 }}
          onContextCreate={this.onContextCreate}
          onRender={this.onRender}
          onResize={this.onResize}
        />
      </PermissionsRequester>
    );
  }

  onContextCreate = async event => {
    await this.arSetup();
    this.commonSetup(event);
  };

  arSetup = async () => {
    await AR.setPlaneDetectionAsync(AR.PlaneDetection.Horizontal);
  };

  commonSetup = ({ gl, scale, width, height }) => {
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio: scale,
      width,
      height,
      clearColor: 0xffffff,
    });
    this.scene = new THREE.Scene();
    this.scene.background = new ExpoTHREE.AR.BackgroundTexture(this.renderer);
    this.camera = new ExpoTHREE.AR.Camera(width, height, 0.01, 1000);
    this.planes = new ExpoTHREE.AR.Planes();
    this.scene.add(this.planes);
  };

  onResize = ({ scale, width, height }) => {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  onRender = () => {
    this.planes.update();
    this.renderer.render(this.scene, this.camera);
  };
}