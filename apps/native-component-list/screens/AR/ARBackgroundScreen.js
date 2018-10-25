import React from 'react';
import { AR, GLView, Permissions } from 'expo';
import { StyleSheet, View } from 'react-native';

import { initShaderProgram, checkGLError } from './ARUtils';
import { PermissionsRequester } from './components';

export default class ARBackgroundScreen extends React.Component {
  static title = 'AR Camera Preview Background (plain WebGL)';

  render() {
    return (
      <PermissionsRequester permissionsTypes={[Permissions.CAMERA]}>
        <View style={{ flex: 1 }}>
          <AR.ARView
            style={StyleSheet.absoluteFill}
            onContextCreate={this.onGLContextCreate}
            onRender={this.onRender}
          />
        </View>
      </PermissionsRequester>
    );
  }

  createBackgroundGLProgram = gl => {
    const program = initShaderProgram(
      gl,
      `
        #version 300 es
        precision highp float;

        in vec2 aTextureCoord;
        out vec2 uv;

        void main() {
          uv = aTextureCoord;
          gl_Position = vec4(1.0 - 2.0 * aTextureCoord, 0.0, 1.0);
        }
      `,
      `
        #version 300 es
        precision highp float;
        
        uniform sampler2D uSampler;
        in vec2 uv;
        out vec4 fragColor;

        void main() {
          fragColor = vec4(1.0 - texture(uSampler, 1.0 - uv).rgb, 1.0);
        }
      `
    );

    return {
      program,
      attribLocations: {
        textureCoord: gl.getAttribLocation(program, 'aTextureCoord'),
      },
      uniformLocations: {
        uSampler: gl.getUniformLocation(program, 'uSampler'),
      },
    };
  };

  createBackgroundBuffers = gl => {
    // vertices would be placed outside the visible box
    // therefore we'll only need one triangle for each face of cube
    //            /\
    //           /  \
    //          /    \
    //         /______\
    //        /| visi |\
    //       / |  ble | \
    //      /  |______|__\
    //     /       ___/
    //    /    ___/
    //   / ___/
    //  /_/
    //

    /* eslint-disable prettier/prettier */
    const verticesCoords = [ // these vertices would be transformed by vertexShader into:
      -2,  0, //  5,  1
       0, -2, //  1,  5
       2,  2, // -3, -3
    ]; // that would allow us to render only one triangle that would contain whole visible screen with texture
    /* eslint-enable */

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesCoords), gl.STATIC_DRAW);

    return {
      positionBuffer,
    };
  };

  createCameraStream = async gl => {
    const { program, attribLocations, uniformLocations } = this.createBackgroundGLProgram(gl);
    checkGLError(gl, 'CREATE PROGRAM');
    const { positionBuffer } = this.createBackgroundBuffers(gl);
    checkGLError(gl, 'CREATE BUFFERS');

    const texture = await AR.getCameraTextureAsync();

    return {
      draw: () => {
        gl.useProgram(program);
        checkGLError(gl, 'USE PROGRAM');

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(attribLocations.textureCoord);
        gl.vertexAttribPointer(attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        checkGLError(gl, 'PASS TEXTURE COORDS');

        gl.uniform1i(uniformLocations.uSampler, 2);
        checkGLError(gl, 'PASS TEXTURE');

        gl.activeTexture(gl.TEXTURE2);
        checkGLError(gl, 'ACTIVE TEXTURE');
        gl.bindTexture(gl.TEXTURE_2D, texture);
        checkGLError(gl, 'BIND TEXTURE');
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        checkGLError(gl, 'DRAW ELEMENTS');
      },
    };
  };

  onGLContextCreate = async ({ gl }) => {
    this.gl = gl;
    this.cameraStream = await this.createCameraStream(this.gl);
  };

  onRender = () => {
    if (!checkGLError(this.gl, 'NATIVE GL FAILURE')) {
      alert('Native part of GL code failed! Inspect there for a reason!');
      return;
    }
    // Clear
    this.gl.clearColor(0, 0.1, 0.2, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    if (!checkGLError(this.gl, 'CLEAR')) {
      return;
    }

    // Draw camera stream
    this.cameraStream.draw();
  };
}
