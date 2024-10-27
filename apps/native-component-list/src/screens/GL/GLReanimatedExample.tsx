import { Asset, useAssets } from 'expo-asset';
import { ExpoWebGLRenderingContext, GLView, getWorkletContext } from 'expo-gl';
import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  runOnUI,
  useSharedValue,
  useAnimatedGestureHandler,
  withSpring,
} from 'react-native-reanimated';

interface RenderContext {
  rotationLocation: WebGLUniformLocation;
  verticesLength: number;
}
type AnimatedGHContext = {
  startX: number;
  startY: number;
};

function initializeContext(gl: ExpoWebGLRenderingContext, asset: Asset): RenderContext {
  'worklet';
  const vertShader = `
  precision highp float;
  uniform vec2 u_translate;
  attribute vec2 a_position;
  varying vec2 uv;
  void main () {
    vec2 translatedPosition = vec2(
      (a_position.x - 0.5) * 0.5 + (u_translate.x * 2.0),
      (a_position.y - 0.5) * 0.3 - (u_translate.y * (1.0 - a_position.y) * 2.0)
    );

    uv = vec2(1.0 - a_position.y,  1.0 - a_position.x);
    gl_Position = vec4(translatedPosition, 0, 1);
  }
`;

  const fragShader = `
  precision highp float;
  uniform sampler2D u_texture;
  varying vec2 uv;
  void main () {
    gl_FragColor = texture2D(u_texture, vec2(uv.y, uv.x));
  }
`;
  const vertices = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]);
  const vert = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vert, vertShader);
  gl.compileShader(vert);

  const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(frag, fragShader);
  gl.compileShader(frag);

  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const positionAttrib = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionAttrib);
  gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset as any);

  const textureLocation = gl.getUniformLocation(program, 'u_texture');
  const rotationLocation = gl.getUniformLocation(program, 'u_translate')!;

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(textureLocation, 0);
  return { rotationLocation, verticesLength: vertices.length };
}

interface ExpoGlHandlers<RenderContext> {
  shouldRunOnUI?: boolean;
  onInit(gl: ExpoWebGLRenderingContext): RenderContext;
  onRender(gl: ExpoWebGLRenderingContext, ctx: RenderContext): void;
}

function useWorkletAwareGlContext<T>(
  { onInit, onRender, shouldRunOnUI = !!(globalThis as any)._WORKLET_RUNTIME }: ExpoGlHandlers<T>,
  dependencies: unknown[] = []
) {
  const [gl, setGl] = useState<ExpoWebGLRenderingContext>();
  const rafId = useSharedValue<number | null>(null);
  const canceled = useSharedValue<boolean>(false);

  useEffect(() => {
    if (!gl) {
      return;
    }
    if (shouldRunOnUI) {
      runOnUI((glCtxId: number) => {
        'worklet';
        const workletGl = getWorkletContext(glCtxId)!;
        const ctx = onInit(workletGl);
        const renderer = () => {
          'worklet';
          if (canceled.value) {
            return;
          }
          onRender(workletGl, ctx);
          rafId.value = requestAnimationFrame(renderer);
        };
        renderer();
      })(gl.contextId);
    } else {
      const ctx = onInit(gl);
      const renderer = () => {
        onRender(gl, ctx);
        requestAnimationFrame(renderer);
      };
      renderer();
    }
    return () => {
      if (shouldRunOnUI) {
        canceled.value = true;
      } else if (rafId.value !== null) {
        cancelAnimationFrame(rafId.value);
      }
    };
  }, [gl, ...dependencies]);
  return (gl: ExpoWebGLRenderingContext) => {
    setGl(gl);
  };
}

export default function GLReanimated() {
  const translation = {
    x: useSharedValue(0),
    y: useSharedValue(0),
  };

  const [assets] = useAssets([require('../../../assets/images/expo-icon.png')]);
  const asset = useSharedValue<Asset | undefined>(undefined);
  useEffect(() => {
    if (assets) {
      // Objects with a prototype are not supported in worklets.
      // We only need values from assets; we can ignore the prototype here.
      asset.value = { ...assets[0] } as Asset;
    }
  }, [assets]);
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    AnimatedGHContext
  >({
    onStart: (_, ctx) => {
      ctx.startX = translation.x.value;
      ctx.startY = translation.y.value;
    },
    onActive: (event, ctx) => {
      translation.x.value = ctx.startX + event.translationX;
      translation.y.value = ctx.startY + event.translationY;
    },
    onEnd: (_) => {
      translation.x.value = withSpring(0);
      translation.y.value = withSpring(0);
    },
  });

  const onContextCreate = useWorkletAwareGlContext<RenderContext>(
    {
      onInit: (gl: ExpoWebGLRenderingContext) => {
        'worklet';
        return initializeContext(gl, asset.value!);
      },
      onRender: (
        gl: ExpoWebGLRenderingContext,
        { rotationLocation, verticesLength }: RenderContext
      ) => {
        'worklet';
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform2fv(rotationLocation, [
          (translation.x.value * 2) / gl.drawingBufferWidth,
          (translation.y.value * 2) / gl.drawingBufferHeight,
        ]);
        gl.drawArrays(gl.TRIANGLES, 0, verticesLength / 2);
        gl.flush();
        gl.flushEXP();
        gl.endFrameEXP();
      },
    },
    [assets?.[0]]
  );

  return (
    <View style={styles.flex}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={styles.flex}>
          {assets ? (
            <GLView
              style={styles.flex}
              onContextCreate={onContextCreate}
              enableExperimentalWorkletSupport
            />
          ) : (
            <Text>Loading</Text>
          )}
        </Animated.View>
      </PanGestureHandler>
      <Text style={styles.text}>
        {(globalThis as any)._WORKLET_RUNTIME
          ? 'Running on UI thread inside reanimated worklet'
          : 'Running on main JS thread, unsupported version of reanimated'}
      </Text>
    </View>
  );
}

GLReanimated.title = 'Reanimated worklets + gesture handler';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  text: {
    padding: 20,
    fontSize: 20,
  },
});
