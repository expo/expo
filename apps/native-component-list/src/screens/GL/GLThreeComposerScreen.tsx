import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer, TextureLoader } from 'expo-three';
import * as React from 'react';
import { LayoutChangeEvent, PixelRatio, StyleSheet, View } from 'react-native';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

import TitledSwitch from '../../components/TitledSwitch';

export default function GLThreeComposer() {
  const [isComposerEnabled, setComposerEnabled] = React.useState(false);
  const [hasGL, setHasGL] = React.useState(false);

  const animationFrameId = React.useRef(-1);
  const gl = React.useRef<null | ExpoWebGLRenderingContext>(null);
  const camera = React.useRef<null | PerspectiveCamera>(null);
  const glitchPass = React.useRef<null | GlitchPass>(null);
  const scene = React.useRef<null | Scene>(null);
  const renderer = React.useRef<null | Renderer>(null);
  const composer = React.useRef<null | EffectComposer>(null);
  const cubes = React.useRef<{ angularVelocity: { x: number; y: number }; mesh: Mesh }[]>([]);

  React.useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = 0;
    };
  }, []);

  React.useEffect(() => {
    if (glitchPass.current) glitchPass.current.enabled = isComposerEnabled;
  }, [isComposerEnabled, glitchPass.current]);

  React.useEffect(() => {
    if (!gl.current || scene.current) {
      return;
    }

    scene.current = new Scene();
    camera.current = new PerspectiveCamera(
      75,
      gl.current.drawingBufferWidth / gl.current.drawingBufferHeight,
      0.1,
      1000
    );

    renderer.current = new Renderer({ gl: gl.current });
    renderer.current.setSize(gl.current.drawingBufferWidth, gl.current.drawingBufferHeight);
    renderer.current.setClearColor(0xffffff);

    composer.current = new EffectComposer(renderer.current);
    composer.current.addPass(new RenderPass(scene.current, camera.current));
    glitchPass.current = new GlitchPass();
    glitchPass.current.enabled = false;
    composer.current.addPass(glitchPass.current);

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({
      transparent: true,
      map: new TextureLoader().load(require('../../../assets/images/nikki.png')),
    });

    cubes.current = Array(24)
      .fill(0)
      .map(() => {
        const mesh = new Mesh(geometry, material);
        scene.current!.add(mesh);
        mesh.position.x = 3 - 6 * Math.random();
        mesh.position.y = 3 - 6 * Math.random();
        mesh.position.z = -5 * Math.random();
        const angularVelocity = {
          x: 0.1 * Math.random(),
          y: 0.1 * Math.random(),
        };
        return { mesh, angularVelocity };
      });

    camera.current.position.z = 3;

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      cubes.current.forEach(({ mesh, angularVelocity }) => {
        mesh.rotation.x += angularVelocity.x;
        mesh.rotation.y += angularVelocity.y;
      });

      if (composer.current) composer.current.render();
      if (gl.current) {
        gl.current.endFrameEXP();
      }
    };

    animate();
    renderer.current.render(scene.current, camera.current);
    gl.current.endFrameEXP();
  }, [gl.current, hasGL]);

  const onLayout = React.useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (camera.current) {
      camera.current.aspect = layout.width / layout.height;
      camera.current.updateProjectionMatrix();
    }
    if (renderer.current) {
      const scale = PixelRatio.get();
      renderer.current.setSize(layout.width * scale, layout.height * scale);
    }
    if (composer.current) {
      composer.current.setSize(layout.width, layout.height);
    }
  }, []);

  return (
    <View style={styles.flex}>
      <GLView
        style={styles.flex}
        onLayout={onLayout}
        onContextCreate={(context: ExpoWebGLRenderingContext) => {
          gl.current = context;
          setHasGL(true);
        }}
      />
      <TitledSwitch
        style={{ position: 'absolute', justifyContent: 'flex-end', top: 0, left: 8, right: 8 }}
        title="Use Composer"
        value={isComposerEnabled}
        setValue={setComposerEnabled}
      />
    </View>
  );
}

GLThreeComposer.title = 'three.js glitch and film effects';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
