import React from 'react';
import { Camera, GLView, Permissions } from 'expo';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import mat4 from 'gl-mat4';

import { initShaderProgram, checkGLError } from './GLUtils';

class GLRotatingCubeWithCameraScreen extends React.Component {
  static title = 'Expo.Camera integration on rotating Cube';

  state = {
    zoom: 0,
    type: Camera.Constants.Type.back,
  };

  componentWillUnmount() {
    cancelAnimationFrame(this.rafID);
  }

  createCameraTexture = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    if (status !== 'granted') {
      throw new Error('Denied camera permissions!');
    }

    return this.glView.createCameraTextureAsync(this.camera);
  };

  createCubeGLProgram = gl => {
    const program = initShaderProgram(
      gl,
      `
        #version 300 es
        precision highp float;

        in vec4 aVertexPosition;
        in vec2 aTextureCoord;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        out vec2 uv;

        void main() {
          uv = aTextureCoord;
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
      `,
      `
        #version 300 es
        precision highp float;

        uniform sampler2D uSampler;

        in vec2 uv;
        out vec4 fragColor;
        
        void main() {
          fragColor = vec4(1.0 - texture(uSampler, uv).rgb, 1.0);
        }
      `
    );
    return {
      program,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(program, 'aTextureCoord;'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
        uSampler: gl.getUniformLocation(program, 'uSampler'),
      },
    };
  };

  createCubeBuffers = gl => {
    // vertices coordinates
    /* eslint-disable prettier/prettier */
    const verticesCoords = [
      // Front face
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,
      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,
      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,
      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,
      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,
      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
    ];
    /* eslint-enable */
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesCoords), gl.STATIC_DRAW);

    /* eslint-disable prettier/prettier */
    const textureCoordinates = [
      // Front
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Back
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Top
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Bottom
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Right
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Left
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
    ];
    /* eslint-enable */
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    /* eslint-disable prettier/prettier */
    const indices = [
      0,  1,  2,   0,  2,  3,    // front
      4,  5,  6,   4,  6,  7,    // back
      8,  9,  10,  8,  10, 11,   // top
      12, 13, 14, 12, 14, 15,   // bottom
      16, 17, 18, 16, 18, 19,   // right
      20, 21, 22, 20, 22, 23,   // left
    ];
    /* eslint-enable */

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      positionBuffer,
      textureCoordBuffer,
      indexBuffer,
    };
  };

  createCubeStream = async (gl) => {
    const { program, attribLocations, uniformLocations } = this.createCubeGLProgram(gl);
    const { positionBuffer, textureCoordBuffer, indexBuffer } = this.createCubeBuffers(gl);

    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const zNear = 0.1;
    const zFar = 100;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -6]);

    return {
      draw: (deltaTime, cameraTexture) => {
        // rotate cube
        mat4.rotate(modelViewMatrix, modelViewMatrix, deltaTime * 0.4, [0, -1, 1]);

        gl.useProgram(program);
        gl.uniformMatrix4fv(uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // pass indices buffer to shader
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // pass vertexes positions buffer to shader
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.vertexPosition);

        // pass texture coordinates buffer to shader
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        gl.vertexAttribPointer(attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.textureCoord);

        // Tell WebGL we want to affect texture unit 1
        gl.activeTexture(gl.TEXTURE1);
        // Tell the shader we bound the texture to texture unit 1
        gl.uniform1i(uniformLocations.uSampler, 1);
        // Bind the texture to texture unit 1
        gl.bindTexture(gl.TEXTURE_2D, cameraTexture);

        // gl.drawArrays
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); // we have 36 vertices
        checkGLError(gl, 'draw cube');
      },
    };
  };

  onContextCreate = async gl => {
    this.gl = gl;

    // Create texture asynchronously
    this.cameraTexture = await this.createCameraTexture();

    // Create cube stream
    this.cubeStream = await this.createCubeStream(this.gl, this.cameraTexture);

    let then = 0;
    // render loop
    const loop = time => {
      this.rafID = requestAnimationFrame(loop);
      const now = time * 0.001;
      const deltaTime = now - then;
      then = now;

      // clear
      this.gl.clearColor(0.4, 0.2, 0.1, 1.0);
      this.gl.clearDepth(1.0);
      this.gl.enable(gl.DEPTH_TEST);
      this.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // draw cube
      this.cubeStream.draw(deltaTime, this.cameraTexture);
      gl.endFrameEXP();
    };
    this.rafID = requestAnimationFrame(loop);
  };

  zoomOut = () =>
    this.setState({
      zoom: this.state.zoom - 0.1 < 0 ? 0 : this.state.zoom - 0.1,
    });

  zoomIn = () =>
    this.setState({
      zoom: this.state.zoom + 0.1 > 1 ? 1 : this.state.zoom + 0.1,
    });

  render() {
    return (
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absluteFill}
          type={this.state.type}
          zoom={this.state.zoom}
          ref={ref => (this.camera = ref)}
        />
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={this.onContextCreate}
          ref={ref => (this.glView = ref)}
        />

        <View style={styles.buttons}>
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

export default GLRotatingCubeWithCameraScreen;
