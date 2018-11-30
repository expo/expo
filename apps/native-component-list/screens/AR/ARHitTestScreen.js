import React from 'react';
import * as ExpoTHREE from 'expo-three';
import * as THREE from 'three';
import { AR, Permissions } from 'expo';
import { Slider, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TouchableView, PermissionsRequester, Toast } from './components';

ExpoTHREE.suppressExpoWarnings();

export default class App extends React.Component {
  static title = 'AR hit test screen (cube change position upon tap)';

  state = {
    rotationSpeed: 0.01,
    cubeScale: 1.0,
    showPoints: false,
  };

  constructor(props) {
    super(props);
    this.toastRef = React.createRef();
  }

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
        {this.renderOptions()}
        <Toast ref={this.toastRef} />
      </PermissionsRequester>
    );
  }

  showNoPointsToast = () => {
    if (this.toastRef.current) {
      this.toastRef.current.show();
    }
  };

  renderOptions = () => {
    return (
      <View style={styles.options}>
        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={this.tooglePoints}>
            <Text style={styles.text}>Toogle Raw Points!</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sliderWrappers}>
          <View style={styles.sliderWrapper}>
            <View style={styles.sliderTextWrapper}>
              <Text style={styles.text}>Rotation Speed: {this.state.rotationSpeed.toFixed(2)}</Text>
            </View>
            <Slider
              minimumValue={0.0}
              maximumValue={1.0}
              step={0.01}
              value={this.state.rotationSpeed}
              onValueChange={this.handleCubeRotation}
            />
          </View>
          <View style={styles.sliderWrapper}>
            <View style={styles.sliderTextWrapper}>
              <Text style={styles.text}>Size: {this.state.cubeScale.toFixed(1)}</Text>
            </View>
            <Slider
              minimumValue={0.5}
              maximumValue={10.0}
              step={0.5}
              value={this.state.cubeScale}
              onValueChange={this.handleCubeSize}
            />
          </View>
        </View>
      </View>
    );
  };

  handleCubeRotation = value => this.setState({ rotationSpeed: value });

  handleCubeSize = value => this.setState({ cubeScale: value });

  handlePointsChange = () => {
    if (this.state.showPoints) {
      this.scene.add(this.points);
    } else {
      this.scene.remove(this.scene.getObjectById(this.points.id));
    }
  };

  tooglePoints = () =>
    this.setState({ showPoints: !this.state.showPoints }, this.handlePointsChange);

  createCube = () => {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshPhongMaterial({ color: 0x76ff03 });
    return new THREE.Mesh(geometry, material);
  };

  onTouchesBegan = async ({ normalizedLocationX, normalizedLocationY }) => {
    if (!this.renderer) {
      return;
    }

    // Invoke the native hit test method
    const hitTest = await AR.performHitTestAsync(
      {
        x: normalizedLocationX,
        y: normalizedLocationY,
      },
      // Result type from intersecting a horizontal plane estimate, determined for the current frame.
      AR.HitTestType.HorizontalPlane
    );

    // check whether we have anything in results
    if (hitTest.length === 0) {
      this.showNoPointsToast();
      return;
    }

    // take worldTransform from first element only
    const { worldTransform } = hitTest[0];

    // remove existing cube
    if (this.cube) {
      this.scene.remove(this.scene.getObjectById(this.cube.id));
    }

    // create a new cube
    this.cube = this.createCube();
    this.scene.add(this.cube);

    const matrix = new THREE.Matrix4();
    matrix.fromArray(worldTransform);

    // manually update the matrix
    this.cube.applyMatrix(matrix);
    this.cube.updateMatrix();
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

    // We will add all of our meshes to this scene.
    this.scene = new THREE.Scene();
    // This will create a camera texture and use it as the background for our scene
    this.scene.background = new ExpoTHREE.AR.BackgroundTexture(this.renderer);
    // Create camera
    this.camera = new ExpoTHREE.AR.Camera(45, width / height, 0.001, 1000);

    // make a cube
    this.cube = this.createCube();
    // Place the cube 0.6 meters in front of us.
    this.cube.position.z = -0.6;
    this.scene.add(this.cube);

    // Add some depth lighting
    this.scene.add(new THREE.AmbientLight(0x404040));
    // Add some direct light
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(3, 3, 3);
    this.scene.add(light);

    // Create this cool utility function that let's us see all the raw data points.
    this.points = new ExpoTHREE.AR.Points();
    if (this.state.showPoints) {
      this.scene.add(this.points);
    }
  };

  // When the phone rotates, or the view changes size, this method will be called.
  onResize = ({ pixelRatio, width, height }) => {
    // Let's stop the function if we haven't setup our scene yet
    if (!this.renderer) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
  };

  // Called every frame.
  onRender = async () => {
    if (this.cube) {
      // rotate and scale the cube
      this.cube.rotation.x += this.state.rotationSpeed * 0.3;
      this.cube.rotation.z += this.state.rotationSpeed * 0.4;
      this.cube.rotation.z += this.state.rotationSpeed * 0.2;

      this.cube.scale.x = this.state.cubeScale;
      this.cube.scale.y = this.state.cubeScale;
      this.cube.scale.z = this.state.cubeScale;
    }

    // this will make the points get more rawDataPoints from Expo.AR
    if (this.state.showPoints) {
      this.points.update();
    }

    // finally render the scene with the AR Camera
    this.renderer.render(this.scene, this.camera);
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  options: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 120, 0, 0.7)',
    padding: 10,
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#55f',
    borderRadius: 5,
  },
  text: {
    color: '#fff',
  },
  sliderWrappers: {
    flex: 3,
  },
  sliderWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  sliderTextWrapper: {
    justifyContent: 'center',
  },
  buttonWrapper: {
    justifyContent: 'center',
    flexDirection: 'column',
  },
});
