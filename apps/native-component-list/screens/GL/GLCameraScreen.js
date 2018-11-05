import React from 'react';
import { Camera, GLView, Permissions } from 'expo';
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

class GLCameraScreen extends React.Component {
  static title = 'Expo.Camera integration';

  state = {
    zoom: 0,
    type: Camera.Constants.Type.back,
  };

  componentWillUnmount() {
    cancelAnimationFrame(this._rafID);
  }

  async createCameraTexture() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    if (status !== 'granted') {
      throw new Error('Denied camera permissions!');
    }

    return this.glView.createCameraTextureAsync(this.camera);
  }

  onContextCreate = async gl => {
    // Create texture asynchronously
    const cameraTexture = (this.texture = await this.createCameraTexture());

    // Compile vertex and fragment shaders
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertShaderSource);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragShaderSource);
    gl.compileShader(fragShader);

    // Link, use program, save and enable attributes
    const program = gl.createProgram();
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
    this.setState({
      type:
        this.state.type === Camera.Constants.Type.back
          ? Camera.Constants.Type.front
          : Camera.Constants.Type.back,
    });
  };

  zoomOut = () => {
    this.setState({
      zoom: this.state.zoom - 0.1 < 0 ? 0 : this.state.zoom - 0.1,
    });
  };

  zoomIn = () => {
    this.setState({
      zoom: this.state.zoom + 0.1 > 1 ? 1 : this.state.zoom + 0.1,
    });
  };

  ref(refName) {
    return ref => {
      this[refName] = ref;
    };
  }

  render() {
    return (
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          type={this.state.type}
          zoom={this.state.zoom}
          ref={this.ref('camera')}
        />
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={this.onContextCreate}
          ref={this.ref('glView')}
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
