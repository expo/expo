import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer, TextureLoader } from 'expo-three';
import * as React from 'react';
import { LayoutChangeEvent, PixelRatio, StyleSheet, View } from 'react-native';
import { PerspectiveCamera, Scene, Sprite, SpriteMaterial } from 'three';

export default function GLThreeSprite() {
  const animationFrameId = React.useRef(-1);
  const gl = React.useRef<null | ExpoWebGLRenderingContext>(null);
  const camera = React.useRef<null | PerspectiveCamera>(null);
  const scene = React.useRef<null | Scene>(null);
  const renderer = React.useRef<null | Renderer>(null);

  React.useEffect(() => {
    return () => {
      if (animationFrameId.current >= 0) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const animate = React.useCallback(() => {
    animationFrameId.current = requestAnimationFrame(animate);

    if (renderer.current && scene.current && camera.current)
      renderer.current.render(scene.current, camera.current);

    if (gl.current) {
      gl.current.endFrameEXP();
    }
  }, []);

  React.useEffect(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animate();
    }
  }, [animate]);

  const onLayout = React.useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (camera.current) {
      camera.current.aspect = layout.width / layout.height;
      camera.current.updateProjectionMatrix();
    }
    if (renderer.current) {
      const scale = PixelRatio.get();
      renderer.current.setSize(layout.width * scale, layout.height * scale);
    }
  }, []);

  const onContextCreate = React.useCallback(
    async (context: ExpoWebGLRenderingContext) => {
      gl.current = context;
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

      const spriteMaterial = new SpriteMaterial({
        map: new TextureLoader().load(require('../../../assets/images/nikki.png')),
        color: 0xffffff,
      });
      const sprite = new Sprite(spriteMaterial);
      scene.current.add(sprite);

      camera.current.position.z = 3;

      animate();
      renderer.current.render(scene.current, camera.current);
      gl.current.endFrameEXP();
    },
    [animate]
  );

  return (
    <View style={styles.flex}>
      <GLView style={styles.flex} onLayout={onLayout} onContextCreate={onContextCreate} />
    </View>
  );
}

GLThreeSprite.title = 'three.js sprite rendering';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
