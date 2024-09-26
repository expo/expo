import * as GL from 'expo-gl';
import { Renderer, TextureLoader, THREE } from 'expo-three';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface State {
  snapshot?: GL.GLSnapshot;
}

export default class GLSnapshotsScreen extends React.PureComponent<object, State> {
  static title = 'Taking snapshots';

  readonly state: State = {};

  rafID?: number;
  glView?: GL.GLView;

  componentWillUnmount() {
    if (this.rafID !== undefined) {
      cancelAnimationFrame(this.rafID);
    }
  }

  takeSnapshot = async () => {
    if (this.glView) {
      const snapshot = await this.glView.takeSnapshotAsync({
        format: 'png',
      });
      this.setState({ snapshot });
    }
  };

  onContextCreate = async (gl: GL.ExpoWebGLRenderingContext) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0xffffff, 0);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: new TextureLoader().load(require('../../../assets/images/swmansion.png')),
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

  render() {
    const { snapshot } = this.state;

    return (
      <View style={styles.flex}>
        <GL.GLView
          style={styles.flex}
          onContextCreate={this.onContextCreate}
          ref={(ref) => (this.glView = ref!)}
        />

        {snapshot && (
          <View style={styles.snapshot}>
            <Image
              style={[styles.flex, { aspectRatio: snapshot.width / snapshot.height }]}
              source={snapshot as { uri: string }}
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
