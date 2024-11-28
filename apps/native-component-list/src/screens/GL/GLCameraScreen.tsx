import { Camera, CameraView } from 'expo-camera';
import * as GL from 'expo-gl';
import { GLView } from 'expo-gl';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const vertShaderSource = `#version 300 es
precision highp float;

in vec2 position;
out vec2 uv;

void main() {
  uv = position;
  gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
}`;

const fragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D cameraTexture;
in vec2 uv;
out vec4 fragColor;

void main() {
  fragColor = vec4(1.0 - texture(cameraTexture, uv).rgb, 1.0);
}`;

interface State {
  zoom: number;
  type: any;
}

class GLCameraScreen extends React.Component<object, State> {
  static title = 'Expo.Camera integration';

  readonly state: State = {
    zoom: 0,
    type: 'back',
  };

  _rafID?: number;
  camera?: CameraView;
  glView?: GL.GLView;
  texture?: WebGLTexture;

  componentWillUnmount() {
    if (this._rafID !== undefined) {
      cancelAnimationFrame(this._rafID);
    }
  }

  async createCameraTexture(): Promise<WebGLTexture> {
    const { status } = await Camera.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Denied camera permissions!');
    }

    return this.glView!.createCameraTextureAsync(this.camera!);
  }

  onContextCreate = async (gl: GL.ExpoWebGLRenderingContext) => {
    // Create texture asynchronously
    this.texture = await this.createCameraTexture();
    const cameraTexture = this.texture;

    // Compile vertex and fragment shaders
    const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertShader, vertShaderSource);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragShader, fragShaderSource);
    gl.compileShader(fragShader);

    // Link, use program, save and enable attributes
    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.validateProgram(program);

    gl.useProgram(program);

    const positionAttrib = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionAttrib);

    // Create, bind, fill buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const verts = new Float32Array([-2, 0, 0, -2, 2, 2]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    // Bind 'position' attribute
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

    // Set 'cameraTexture' uniform
    gl.uniform1i(gl.getUniformLocation(program, 'cameraTexture'), 0);

    // Activate unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Render loop
    const loop = () => {
      this._rafID = requestAnimationFrame(loop);

      // Clear
      gl.clearColor(0, 0, 1, 1);
      // tslint:disable-next-line: no-bitwise
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Bind texture if created
      gl.bindTexture(gl.TEXTURE_2D, cameraTexture);

      // Draw!
      gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);

      // Submit frame
      gl.endFrameEXP();
    };
    loop();
  };

  toggleFacing = () => {
    this.setState((state) => ({
      type: state.type === 'back' ? 'front' : 'back',
    }));
  };

  zoomOut = () => {
    this.setState((state) => ({
      zoom: state.zoom - 0.1 < 0 ? 0 : state.zoom - 0.1,
    }));
  };

  zoomIn = () => {
    this.setState((state) => ({
      zoom: state.zoom + 0.1 > 1 ? 1 : state.zoom + 0.1,
    }));
  };

  render() {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={this.state.type}
          zoom={this.state.zoom}
          ref={(ref) => (this.camera = ref!)}
        />
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={this.onContextCreate}
          ref={(ref) => (this.glView = ref!)}
        />

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={this.toggleFacing}>
            <Text>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={this.zoomIn}>
            <Text>Zoom in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={this.zoomOut}>
            <Text>Zoom out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  buttons: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  button: {
    flex: 1,
    height: 40,
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GLCameraScreen;
