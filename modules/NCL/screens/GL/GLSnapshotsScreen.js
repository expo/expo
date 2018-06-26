import React from 'react';
import * as THREE from 'three';
import { GLView } from 'expo-gl';
import { Asset } from 'expo-asset';
import ExpoTHREE from 'expo-three';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default class GLSnapshotsScreen extends React.PureComponent {
  static title = 'Taking snapshots';

  state = {
    snapshot: null,
  };

  componentWillUnmount() {
    cancelAnimationFrame(this.rafID);
  }

  takeSnapshot = async () => {
    const { glView } = this;

    if (glView) {
      const snapshot = await glView.takeSnapshotAsync({
        format: 'png',
      });
      this.setState({ snapshot });
    }
  };

  onContextCreate = async gl => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    const renderer = ExpoTHREE.createRenderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0xffffff, 0);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Asset.fromModule(require('../../assets/images/swmansion.png')),
      }),
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 3;

    const animate = () => {
      this.rafID = requestAnimationFrame(animate);

      cube.rotation.x += 0.02;
      cube.rotation.y += 0.03;
      cube.position.x = Math.sin(cube.rotation.x);
      cube.position.y = Math.cos(cube.rotation.y);

      renderer.render(scene, camera);

      gl.endFrameEXP();
    };
    animate();
  };

  setGLViewRef = ref => {
    this.glView = ref;
  };

  render() {
    const { snapshot } = this.state;

    return (
      <View style={styles.flex}>
        <GLView
          style={styles.flex}
          onContextCreate={this.onContextCreate}
          ref={this.setGLViewRef}
        />

        {snapshot && (
          <View style={styles.snapshot}>
            <Image
              style={[styles.flex, { aspectRatio: snapshot.width / snapshot.height }]}
              source={snapshot}
            />
          </View>
        )}
        <TouchableOpacity style={styles.snapshotButton} onPress={this.takeSnapshot}>
          <Text>Take snapshot</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  snapshot: {
    height: 100,
    margin: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'black',
    backgroundColor: '#248e80',
    position: 'absolute',
    left: 0,
    bottom: 0,
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  snapshotButton: {
    margin: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'black',
    borderRadius: 5,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});
