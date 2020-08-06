import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AmbientLight,
  BasicShadowMap,
  BoxGeometry,
  CameraHelper,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  Mesh,
  MeshPhongMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneBufferGeometry,
  Scene,
  WebGLRenderer,
} from 'three';

export default function GLThreeDepthStencilBuffer() {
  const animationFrameId = React.useRef(-1);

  React.useEffect(() => {
    return () => {
      if (animationFrameId.current >= 0) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const onContextCreate = React.useCallback(async (gl: ExpoWebGLRenderingContext) => {
    const renderer = new WebGLRenderer({
      context: gl,
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = BasicShadowMap;

    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0xffffff, 1.0);
    renderer.shadowMap.enabled = true;

    // Standard Camera
    const camera = new PerspectiveCamera(
      70,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 0);
    camera.lookAt(0, 0, 0);

    const scene = new Scene();

    scene.add(new AmbientLight(0xffffff, 0.5));

    // Three's lights use depth and stencil buffers.
    const light = new DirectionalLight(0xffffff, 0.5);
    light.position.set(0, 6, 0);
    light.castShadow = true;
    light.shadow.camera.left = -1;
    light.shadow.camera.right = 1;
    light.shadow.camera.top = -1;
    light.shadow.camera.bottom = 1;
    scene.add(light);

    const shadowHelper = new DirectionalLightHelper(light, 2, 0x0000ff);
    scene.add(shadowHelper);

    // Create a plane that receives shadows (but does not cast them).
    const planeGeometry = new PlaneBufferGeometry(10, 10, 32, 32);
    const planeMaterial = new MeshStandardMaterial({
      color: 0x00ff00,
      side: DoubleSide,
    });

    const plane = new Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.rotation.x = Math.PI / 2;
    plane.position.y = -2;
    scene.add(plane);

    const cube = new Mesh(
      new BoxGeometry(1.2, 1.2, 1.2),
      new MeshPhongMaterial({
        color: 0xffff00,
      })
    );
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.renderOrder = 3;
    scene.add(cube);

    const another = new Mesh(
      new BoxGeometry(1.4, 1.4, 1.4),
      new MeshPhongMaterial({
        color: 0xff0000,
      })
    );
    another.position.set(0, 2, 0);
    another.castShadow = true;
    another.receiveShadow = true;
    another.renderOrder = 1;
    scene.add(another);

    const helper = new CameraHelper(light.shadow.camera);
    scene.add(helper);

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
    renderer.render(scene, camera);
    gl.endFrameEXP();
  }, []);

  return (
    <View style={styles.flex}>
      <GLView style={styles.flex} onContextCreate={onContextCreate} />
    </View>
  );
}

GLThreeDepthStencilBuffer.title = 'three.js depth and stencil buffer';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
