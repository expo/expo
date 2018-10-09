import React from 'react';
import {
  AR,
  GLView,
} from 'expo';
import { findNodeHandle, StyleSheet, View } from 'react-native';
import { mat4 } from 'gl-matrix';

import { initShaderProgram, checkGLError } from './ARUtils';

export default class ARRotatingCube extends React.Component {
  static title = 'AR Rotating Cube';

  render() {
    return (
      <View style={{ flex: 1 }}>
        <GLView
          ref={ref => (this.glView = ref)}
          style={StyleSheet.absoluteFill}
          onContextCreate={this.onGLContextCreate}
        />
      </View>
    );
  }

  createBackgroundGLProgram = gl => {
    const program = initShaderProgram(gl, `
      precision highp float;

      attribute vec2 aTextureCoord;
      varying vec2 uv;

      void main() {
        uv = aTextureCoord;
        gl_Position = vec4(1.0 - 2.0 * aTextureCoord, -1, 1);
      }
    `, `
      precision highp float;
      
      uniform sampler2D uSampler;
      varying vec2 uv;
      
      void main() {
        gl_FragColor = texture2D(uSampler, vec2(1) - uv);
      }
    `);

    return {
      program,
      attribLocations: {
        textureCoord: gl.getAttribLocation(program, 'position'),
      },
      uniformLocations: {
        uSampler: gl.getUniformLocation(program, 'uSampler'),
      },
    };
  }

  createCubeGLProgram = gl => {
    const program = initShaderProgram(gl, `
      precision highp float;
      
      attribute vec4 aVertexPosition;
      attribute vec2 aTextureCoord;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;

      varying vec2 uv;

      void main() {
        uv = aTextureCoord;
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      }
    `, `
      precision highp float;
    
      uniform sampler2D uSampler;

      varying vec2 uv;

      void main() {
        gl_FragColor = texture2D(uSampler, uv);
      }
    `);

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
  }

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
    const verticesCoords = [ // these vertices would be transformed by vertexShader into:
      -2,  0, //  5,  1
       0, -2, //  1,  5
       2,  2, // -3, -3
    ]; // that would allow us to render only one triangle that would contain whole visible screen with texture
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesCoords), gl.STATIC_DRAW);

    return {
      positionBuffer,
    };
  }

  createCameraStream = async gl => {
    const {
      program,
      attribLocations,
      uniformLocations,
    } = this.createBackgroundGLProgram(gl);

    const {
      positionBuffer,
    } = this.createBackgroundBuffers(gl);

    const capturedCameraTexture = await AR.getCameraTextureAsync();
    const texture = new WebGLTexture(capturedCameraTexture);
    
    return {
      draw: () => {
        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(attribLocations.textureCoord);
        gl.vertexAttribPointer(attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1i(uniformLocations.uSampler, 0);

        // cleanup element array buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawArrays(gl.TRIANGLES, 0, 3); // we have 3 vertices
        checkGLError(gl, 'draw camera');
      },
    };
  };

  createCubeBuffers = gl => {
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
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesCoords), gl.STATIC_DRAW);
  
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
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  
    const indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      positionBuffer,
      textureCoordBuffer,
      indexBuffer,
    };
  }

  createCubeStream = async gl => {
    const {
      program,
      attribLocations,
      uniformLocations,
    } = this.createCubeGLProgram(gl);

    const {
      positionBuffer,
      textureCoordBuffer,
      indexBuffer,
    } = this.createCubeBuffers(gl);

    const fieldOfView = 45 * Math.PI / 180; // in radians
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const zNear = 0.1;
    const zFar = 100;
    const projectionMatrix = mat4.create();
    let cubeRotation = 0;
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -4]);

    const capturedCameraTexture = await AR.getCameraTextureAsync();
    const texture = new WebGLTexture(capturedCameraTexture);

    return {
      draw: (deltaTime) => {
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
        // Bind the texture to texture unit 1
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Tell the shader we bound the texture to texture unit 1
        gl.uniform1i(uniformLocations.uSampler, 1);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); // we have 36 vertices
        checkGLError(gl, 'draw cube');
      },
    };
  }

  onGLContextCreate = async gl => {
    this.gl = gl;
    
    await AR.startAsync(findNodeHandle(this.glView.nativeRef), AR.TrackingConfiguration.World);
    
    // this.cameraStream = await this.createCameraStream(this.gl);
    this.cubeStream = await this.createCubeStream(this.gl);

    let then = 0;
    // Render loop
    const loop = (time) => {
      const now = time * 0.001;
      const deltaTime = now - then;
      then = now;

      // Clear
      gl.clearColor(0.2, 0.5, 0.5, 1);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      if (this.cubeStream) {
        this.cubeStream.draw(deltaTime);
      }

      // Submit frame
      gl.endFrameEXP();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
}
