import React from 'react';
import { ActivityIndicator, InteractionManager, StyleSheet, View } from 'react-native';
import * as GL from 'expo-gl';

import REGL from 'regl';
import mat4 from 'gl-mat4';
import hsv2rgb from 'hsv2rgb';

const NUM_POINTS = 1e4;
const VERT_SIZE = 4 * (4 + 4 + 3);

export default class BasicScene extends React.Component {
  static title = 'GLView example';
  static navigationOptions = {
    title: 'GLView example',
  };

  state = {
    transitionIsComplete: false,
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setState({ transitionIsComplete: true });
    });
  }

  render() {
    if (!this.state.transitionIsComplete) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      );
    }

    return <GL.GLView style={StyleSheet.absoluteFill} onContextCreate={this._onContextCreate} />;
  }

  _onContextCreate = (gl: GL.ExpoWebGLRenderingContext) => {
    const regl = REGL({ gl });

    const pointBuffer = regl.buffer(
      Array(NUM_POINTS)
        .fill(0)
        .map(() => {
          const color = hsv2rgb(Math.random() * 360, 0.6, 1);
          return [
            // freq
            Math.random() * 10,
            Math.random() * 10,
            Math.random() * 10,
            Math.random() * 10,
            // phase
            2.0 * Math.PI * Math.random(),
            2.0 * Math.PI * Math.random(),
            2.0 * Math.PI * Math.random(),
            2.0 * Math.PI * Math.random(),
            // color
            color[0] / 255,
            color[1] / 255,
            color[2] / 255,
          ];
        })
    );

    const drawParticles = regl({
      vert: `
  precision highp float;
  attribute vec4 freq, phase;
  attribute vec3 color;
  uniform float time;
  uniform mat4 view, projection;
  varying vec3 fragColor;
  void main() {
    vec3 position = 8.0 * cos(freq.xyz * time + phase.xyz);
    gl_PointSize = 10.0 * (1.0 + cos(freq.w * time + phase.w));
    gl_Position = projection * view * vec4(position, 1);
    fragColor = color;
  }`,

      frag: `
  precision lowp float;
  varying vec3 fragColor;
  void main() {
    if (length(gl_PointCoord.xy - 0.5) > 0.5) {
      discard;
    }
    gl_FragColor = vec4(fragColor, 1);
  }`,

      attributes: {
        freq: {
          buffer: pointBuffer,
          stride: VERT_SIZE,
          offset: 0,
        },
        phase: {
          buffer: pointBuffer,
          stride: VERT_SIZE,
          offset: 16,
        },
        color: {
          buffer: pointBuffer,
          stride: VERT_SIZE,
          offset: 32,
        },
      },

      uniforms: {
        view: ({ time: t }: { time: number }) => {
          t = t * 0.1;
          return mat4.lookAt([], [30 * Math.cos(t), 2.5, 30 * Math.sin(t)], [0, 0, 0], [0, 1, 0]);
        },
        projection: mat4.perspective(
          [],
          Math.PI / 4,
          gl.drawingBufferWidth / gl.drawingBufferHeight,
          0.01,
          1000
        ),
        time: ({ time }: { time: number }) => time * 0.1,
      },

      count: NUM_POINTS,

      primitive: 'points',
    });

    const frame = () => {
      regl.poll();
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1,
      });

      drawParticles();

      gl.flush();
      gl.endFrameEXP();
      requestAnimationFrame(frame);
    };
    frame();
  }
}
