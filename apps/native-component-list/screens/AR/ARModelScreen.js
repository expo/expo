import React from 'react';
import * as ExpoTHREE from 'expo-three';
import * as THREE from 'three';
import { AR, Permissions } from 'expo';
import { StyleSheet } from 'react-native';

// TODO: it's connected with not-loaded assets
// import Models from './Models';

import { TouchableView, PermissionsRequester } from './components';

ExpoTHREE.suppressExpoWarnings();

export default class App extends React.Component {
  static title = 'AR model screen';

  render() {
    return (
      <PermissionsRequester permissionsTypes={[Permissions.CAMERA]}>
        <TouchableView
          style={styles.container}
          shouldCancelWhenOutside={false}
          onTouchesBegan={this.onTouchesBegan}>
          <AR.ARView
            onContextCreate={this.onContextCreate}
            onRender={this.onRender}
            onResize={this.onResize}
          />
        </TouchableView>
      </PermissionsRequester>
    );
  }

  createCube = () => {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshPhongMaterial({ color: 0x76ff03 });
    return new THREE.Mesh(geometry, material);
  };

  onTouchesBegan = () => {
    if (!this.rednerer) {
      return;
    }
    this.setState({ disableLights: this.state.disableLights }, () => {
      if (this.state.disableLights) {
        this.scene.remove(this.shadowLight);
      } else {
        this.scene.add(this.shadowLight);
      }
    });
  };

  // When our context is built we can start coding 3D things.
  onContextCreate = async (gl, { width, height }) => {
    // Create a 3D renderer
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      width,
      height,
      clearColor: 0xfffc00,
    });

    // Enable some realist rendering props: https://threejs.org/docs/#api/renderers/WebGLRenderer.physicallyCorrectLights
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    // this.renderer.toneMappingExposure = Math.pow(0.68, 5.0); // to allow for very bright scenes.

    this.screenCenter = new THREE.Vector2(0.5, 0.5);

    // We will add all of our meshes to this scene.
    this.scene = new THREE.Scene();
    // This will create a camera texture and use it as the background for our scene
    this.scene.background = new ExpoTHREE.AR.BackgroundTexture(this.renderer);
    // Create camera
    this.camera = new ExpoTHREE.AR.Camera(45, width / height, 0.001, 1000);

    // Create AR lights
    this.arPointLight = new ExpoTHREE.AR.Light();
    this.arPointLight.position.y = 2;
    this.scene.add(this.arPointLight);

    this.shadowLight = new THREE.DirectionalLight(0xffffff, 0.6);
    this.shadowLight.castShadow = true;

    // default is 50
    const shadowSize = 1;
    this.shadowLight.shadow.camera.left = -shadowSize;
    this.shadowLight.shadow.camera.right = shadowSize;
    this.shadowLight.shadow.camera.top = shadowSize;
    this.shadowLight.shadow.camera.bottom = -shadowSize;
    this.shadowLight.shadow.camera.near = 0.001;
    this.shadowLight.shadow.camera.far = 100;
    this.shadowLight.shadow.camera.updateProjectionMatrix();

    this.scene.add(this.shadowLight);
    this.scene.add(this.shadowLight.target);
    // this.scene.add(new THREE.DirectionalLightHelper(this.shadowLight));

    this.scene.add(new THREE.AmbientLight(0x404040));

    this.mesh = new THREE.Object3D();
    this.shadowFloor = new ExpoTHREE.AR.ShadowFloor({
      width: 1,
      height: 1,
      opacity: 0.6,
    });
    this.mesh.add(this.shadowFloor);

    this.magneticObject = new ExpoTHREE.AR.MagneticObject();
    // Don't scale up with distance
    this.magneticObject.maintainScale = false;
    this.magneticObject.add(this.mesh);
    this.scene.add(this.magneticObject);

    // TODO: here's something bad happening :(
    // await this.loadModel();
  };

  // loadModel = async () => {
  //   const collada = await ExpoTHREE.loadDaeAsync({
  //     asset: Models.stormtrooper['stormtrooper.dae'],
  //     onAssetRequested: Models.stormtrooper,
  //   });

  //   const { scene, animations } = collada;
  //   scene.traverse(child => {
  //     if (child instanceof THREE.Mesh) {
  //       child.castShadow = true;
  //       child.receiveShadow = true;
  //     }
  //   });

  //   scene.rotation.z = Math.PI;
  //   scene.castShadow = true;

  //   ExpoTHREE.utils.scaleLongestSideToSize(scene, 0.3);

  //   this.mixer = new THREE.AnimationMixer(scene);
  //   this.mixer.clipAction(animations[0]).play();

  //   this.mesh.add(scene);
  // };

  onResize = ({ pixelRatio, width, height }) => {
    if (!this.renderer) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
  };

  // Called every frame.
  onRender = async delta => {
    this.magneticObject.update(this.camera, this.screenCenter);

    this.arPointLight.update();
    if (this.mixer && this.mesh.visible) {
      this.mixer.update(delta);
    }

    this.shadowFloor.opacity = this.arPointLight.intensity;

    this.shadowLight.target.position.copy(this.magneticObject.position);
    this.shadowLight.position.copy(this.shadowLight.target.position);
    this.shadowLight.position.x += 0.1;
    this.shadowLight.position.y += 1;
    this.shadowLight.position.z += 0.1;

    // finally render the scene with the AR Camera
    this.renderer.render(this.scene, this.camera);
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
