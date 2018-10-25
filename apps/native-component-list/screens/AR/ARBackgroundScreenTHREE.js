import React from 'react';
import { AR, Permissions } from 'expo';
import { StyleSheet, View } from 'react-native';
// import * as THREE from 'three';
// import * as ExpoTHREE from 'expo-three';

import { initShaderProgram, checkGLError } from './ARUtils';
import { PermissionsRequester } from './components';

export default class ARBackgrounScreenTHREE extends React.Component {
  static title = 'AR Camera Preview Background (ExpoTHREE)';
  drawn = false;

  render() {
    return (
      <PermissionsRequester permissionsTypes={[Permissions.CAMERA]}>
        <View style={StyleSheet.absoluteFill}>
          <AR.ARView
            style={StyleSheet.absoluteFill}
            onContextCreate={this.onContextCreate}
            onRender={this.onRender}
          />
        </View>
      </PermissionsRequester>
    );
  }

  onContextCreate = async ({ gl, scale, width, height }) => {
    this.gl = gl;
    // this.renderer = new ExpoTHREE.Renderer({
    //   gl,
    //   pixelRatio: scale,
    //   width,
    //   height,
    //   clearColor: 0xffffff,
    // });
    // this.scene = new THREE.Scene();
    // this.scene.background = new ExpoTHREE.AR.BackgroundTexture(this.renderer);
    // this.camera = new THREE.PerspectiveCamera(width, height, 0.01, 1000);
    this.squareStream = await this.createSquareStream(gl);
  };

  onRender = () => {
    // this.renderer.render(this.scene, this.camera);
    this.gl.clearColor(0.2, 0.5, 0.5, 1);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.squareStream.draw();
  };

  createSquareStream = async gl => {
    const { program, attribLocations, uniformLocations } = this.createSquareGLProgram(gl);
    const { positionBuffer, textureCoordBuffer, indexBuffer } = this.createSquareBuffers(gl);

    const texture = await AR.getCameraTextureAsync();

    return {
      draw: () => {
        gl.useProgram(program);
        checkGLError(gl, 'USING SHADER PROGRAM');

        // pass indices buffer to shader
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        checkGLError(gl, 'PASSING VERTICES INDICES TO SHADER');

        // pass vertexes positions buffer to shader
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.vertexPosition);
        checkGLError(gl, 'PASSING VERTICES COORD TO SHADER');

        // pass texture coordinates buffer to shader
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        gl.vertexAttribPointer(attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.textureCoord);
        checkGLError(gl, 'PASSING TEXTURE COORD TO SHADER');

        // Tell the shader we bound the texture will be bound to specific texture unit
        gl.uniform1i(uniformLocations.uSampler, 0);
        checkGLError(gl, 'PASSING TEXTURE TO SHADER');
        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        checkGLError(gl, 'ACTIVATING TEXTURE');
        // Bind the texture to texture specified texture unit
        gl.bindTexture(gl.TEXTURE_2D, texture);
        checkGLError(gl, 'BINDING TEXTURE');

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); // we have 6 vertices
        checkGLError(gl, 'DRAW ELEMENTS');
      },
    };
  };

  createSquareGLProgram = gl => {
    const program = initShaderProgram(
      gl,
      `
        #version 300 es
        precision highp float;
        
        in vec4 aVertexPosition;
        in vec2 aTextureCoord;

        out vec2 uv;

        void main() {
          uv = aTextureCoord;
          gl_Position = aVertexPosition;
        }
      `,
      `
        #version 300 es
        precision highp float;
      
        uniform sampler2D uSampler;
        in vec2 uv;
        out vec4 fragColor;

        void main() {
          fragColor = texture(uSampler, uv);
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

  createSquareBuffers = gl => {
    /* eslint-disable prettier/prettier */
    // vertices coordinates
    const verticesCoords = [
      // Front face
      +0.15, +0.15, 1.0,
      +0.85, +0.15, 1.0,
      +0.85, +0.85, 1.0,
      +0.15, +0.85, 1.0,
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
    ];
    /* eslint-enable prettier/prettier */

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    /* eslint-disable prettier/prettier */
    const indices = [
      0,  1,  2,  0,  2,  3,    // front
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
}
