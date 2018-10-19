import React from 'react';
import { Asset, Camera, Permissions, GLView } from 'expo';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import * as ExpoTHREE from 'expo-three';

export default class GLTHREEWithCameraTextureScreen extends React.Component {
  static title = 'ExpoTHREE with Camera based texture';

  componentWillUnmount() {
    this.gl = null;
    cancelAnimationFrame(this.rafID);
  }

  componentDidMount() {
    alert(`
      This screen is slithly broken on Android, because THREE.js is not displaying camera texture provided by native Android side at all.
      Backgrounf that you see behind rotating cube is just a snapshot from Camera component that is mounted behind GLView component.
    `);
  }

  render() {
    return (
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          type={Camera.Constants.Type.back}
          zoom={0}
          ref={ref => (this.camera = ref)}
        />
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={this.onContextCreate}
          ref={ref => (this.glView = ref)}
        />
      </View>
    );
  }

  createCameraTexture = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    if (status !== 'granted') {
      throw new Error('Denied camera permissions!');
    }

    return this.glView.createCameraTextureAsync(this.camera);
  };

  onContextCreate = async gl => {
    this.gl = gl;

    this.cameraTexture = await this.createCameraTexture();

    this.renderer = new ExpoTHREE.Renderer({ gl });
    this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    this.renderer.setClearColor(0xcc55aa);

    this.scene = new THREE.Scene();

    // prepate texture and rotate it as THREE.js rotates texture by 180 degrees
    const backgroundTexture = new THREE.Texture();
    backgroundTexture.rotation = THREE.Math.degToRad(180);
    backgroundTexture.center = new THREE.Vector2(0.5, 0.5);

    // inject textureID given by native side
    const properties = this.renderer.properties.get(backgroundTexture);
    properties.__webglTexture = this.cameraTexture;
    properties.__webglInit = true;

    this.scene.background = backgroundTexture;
    this.camera = new THREE.PerspectiveCamera(
      70,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    this.camera.position.z = 3;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      map: await ExpoTHREE.loadTextureAsync({
        asset: Asset.fromModule(require('../../assets/images/nikki.png')),
      }),
    });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);

    const animate = () => {
      this.rafID = requestAnimationFrame(animate);

      cube.rotation.x += 0.004;
      cube.rotation.y += 0.01;

      this.renderer.render(this.scene, this.camera);

      gl.endFrameEXP();
    };
    animate();
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
});
