import React from 'react';
import {
  AR,
  GLView,
} from 'expo';
import { findNodeHandle, StyleSheet, View } from 'react-native';
import { mat4 } from 'gl-matrix';

import { initShaderProgram } from './ARUtils';

// console.log('AR:', AR);

export default class ARSimpleScreen extends React.Component {
  static title = 'Simple AR Screen';

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
        gl_Position = vec4(1.0 - 2.0 * aTextureCoord, 0, 1);
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
      attribute vec4 aVertexColor;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;

      varying vec4 vColor;

      void main() {
        vColor = aVertexColor;
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      }
    `, `
      precision highp float;
      
      varying vec4 vColor;

      void main() {
        gl_FragColor = vColor;
      }
    `);

    return {
      program,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(program, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
      },
    };
  }

  createCameraStream = async gl => {
    const {
      program,
      attribLocations,
      uniformLocations,
    } = this.createBackgroundGLProgram(gl);
    gl.useProgram(program);

    // Create, bind, fill buffer
    const buffer = gl.createBuffer();
    const verts = new Float32Array([ // these vertices would be transformed by vertexShader into:
      -2,  0, //  5,  1
       0, -2, //  1,  5
       2,  2, // -3, -3
    ]); // that would allow us to render only one triangle that would contain whole visible screen with texture
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(attribLocations.textureCoord);
    gl.vertexAttribPointer(attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);

    const capturedCameraTexture = await AR.getCameraTextureAsync();
    const texture = new WebGLTexture(capturedCameraTexture);

    // Set 'texture' uniform
    gl.uniform1i(uniformLocations.uSampler, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    return {
      draw: () => {
        gl.drawArrays(gl.TRIANGLES, 0, 3); // we have 3 vertices
        this.checkGLError(gl, 'draw camera');
      },
    };
  };

  createCubeBuffers = gl => {
    // vertices coordinates
    const verticesCoords = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesCoords), gl.STATIC_DRAW);
    
    // vertices colors
    const verticesColors = [
      1.0,  1.0,  1.0,  1.0,
      1.0,  0.0,  0.0,  1.0,
      0.0,  1.0,  0.0,  1.0,
      0.0,  0.0,  1.0,  1.0,
    ];
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesColors), gl.STATIC_DRAW);
    
    return {
      positionBuffer,
      colorBuffer,
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
      colorBuffer,
    } = this.createCubeBuffers(gl);

    const fieldOfView = 45 * Math.PI / 180; // in radians
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const zNear = 0.1;
    const zFar = 100;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -10]);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribLocations.vertexColor);

    gl.useProgram(program);
    gl.uniformMatrix4fv(uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(uniformLocations.modelViewMatrix, false, modelViewMatrix);

    return {
      draw: () => {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // we have 4 vertices
        this.checkGLError(gl, 'draw cube');
      },
    };
  }

  checkGLError = (gl, logPrefix) => {
    const codes = {
      [gl.INVALID_ENUM]: 'INVALID_ENUM',
      [gl.INVALID_VALUE]: 'INVALID_VALUE',
      [gl.INVALID_OPERATION]: 'INVALID_OPERATION',
      [gl.INVALID_FRAMEBUFFER_OPERATION]: 'INVALID_FRAMEBUFFER_OPERATION',
      [gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
      [gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL',
      [gl.NO_ERROR]: 'NO_ERROR',
      default: 'NOT RECOGNISED ERROR',
    };
    let errorCode;
    while ((errorCode = gl.getError())) {
      console.warn(`${logPrefix ? `[${String(logPrefix).toUpperCase()}]` : ''} GL error occured: ${codes[errorCode] || codes.default}`);
    }
  }

  onGLContextCreate = async gl => {
    this.gl = gl;
    
    await AR.startAsync(findNodeHandle(this.glView.nativeRef), AR.TrackingConfigurations.World);
    
    // this.cameraStream = await this.createCameraStream(this.gl);
    this.cubeStream = await this.createCubeStream(this.gl);

    // Render loop
    const loop = () => {
      // Clear
      gl.clearColor(0.2, 0.5, 0.5, 1);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      // Draw camera stream
      if (this.cameraStream) {
        this.cameraStream.draw();
      }
      if (this.cubeStream) {
        this.cubeStream.draw();
      }
      
      // Submit frame
      gl.endFrameEXP();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
}
