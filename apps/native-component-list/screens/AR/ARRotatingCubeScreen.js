import React from 'react';
import { AR, Permissions } from 'expo';
import { StyleSheet, View } from 'react-native';
import mat4 from 'gl-mat4';

import { initShaderProgram, checkGLError } from './ARUtils';
import { PermissionsRequester } from './components';

const vertexShaderSource = `#version 300 es
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
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uSampler;
in vec2 uv;
out vec4 fragColor;

void main() {
  fragColor = texture(uSampler, uv);
}
`;

export default class ARRotatingCubeScreen extends React.Component {
  static title = 'AR Rotating Cube with Camera Preview texture (plain WebGL)';

  render() {
    return (
      <PermissionsRequester permissionsTypes={[Permissions.CAMERA]}>
        <View style={{ flex: 1 }}>
          <AR.ARView
            ref={ref => (this.glView = ref)}
            style={StyleSheet.absoluteFill}
            onContextCreate={this.onGLContextCreate}
            onRender={this.onRender}
          />
        </View>
      </PermissionsRequester>
    );
  }

  createCubeGLProgram = gl => {
    const program = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

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
    /* eslint-disable prettier/prettier */
    // vertices coordinates
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
      0,  1,  2,  0,  2,  3,    // front
      4,  5,  6,  4,  6,  7,    // back
      8,  9,  10, 8,  10, 11,   // top
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

  createCubeStream = async gl => {
    const { program, attribLocations, uniformLocations } = this.createCubeGLProgram(gl);
    const { positionBuffer, textureCoordBuffer, indexBuffer } = this.createCubeBuffers(gl);

    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const zNear = 0.1;
    const zFar = 100;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -8]);

    const texture = await AR.getCameraTextureAsync();

    return {
      draw: deltaTime => {
        // rotate cube
        mat4.rotate(modelViewMatrix, modelViewMatrix, deltaTime * 0.4, [0, -1, 1]);

        gl.useProgram(program);
        checkGLError(gl, 'USING SHADER PROGRAM');
        gl.uniformMatrix4fv(uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(uniformLocations.modelViewMatrix, false, modelViewMatrix);
        checkGLError(gl, 'PASSING UNIFORMS TO SHADER');

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
        gl.uniform1i(uniformLocations.uSampler, 2);
        checkGLError(gl, 'PASSING TEXTURE TO SHADER');
        // Tell WebGL we want to affect texture unit 2
        gl.activeTexture(gl.TEXTURE2);
        checkGLError(gl, 'ACTIVATING TEXTURE');
        // Bind the texture to texture specified texture unit
        gl.bindTexture(gl.TEXTURE_2D, texture);
        checkGLError(gl, 'BINDING TEXTURE');

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); // we have 36 vertices
        gl.finish();
        checkGLError(gl, 'DRAW ELEMENTS');
      },
    };
  };

  onGLContextCreate = async gl => {
    this.gl = gl;
    this.cubeStream = await this.createCubeStream(this.gl);
  };

  onRender = deltaTime => {
    if (!checkGLError(this.gl, 'NATIVE GL FAILURE')) {
      alert('Native part of GL code failed! Inspect there for a reason!');
      return;
    }

    // Clear
    this.gl.clearColor(0.2, 0.5, 0.5, 1);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.cubeStream.draw(deltaTime);
  };
}
