import React from 'react';
import { AR, Permissions } from 'expo';
import { StyleSheet, View } from 'react-native';

import { initShaderProgram, checkGLError } from './ARUtils';
import { PermissionsRequester } from './components';

const vertexShaderSource = `#version 300 es
precision mediump float;

in vec2 aVertexCoord;
in vec2 aTextureCoord;
out vec2 uv;

void main() {
  uv = aTextureCoord;
  gl_Position = vec4(aVertexCoord, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
        
uniform sampler2D uSampler;
in vec2 uv;
out vec4 fragColor;

void main() {
  // fragColor = vec4(1.0 - texture(uSampler, uv).rgb, 1.0); // inverted colors
  fragColor = texture(uSampler, uv); // natural colors
}
`;

export default class ARBackgroundScreenVAO extends React.Component {
  static title = 'AR Camera Preview Background (plain WebGL with VAO)';

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

  createGLProgram = gl => {
    const program = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    return {
      program,
      attribLocations: {
        vertexCoord: gl.getAttribLocation(program, 'aVertexCoord'),
        textureCoord: gl.getAttribLocation(program, 'aTextureCoord'),
      },
      uniformLocations: {
        uSampler: gl.getUniformLocation(program, 'uSampler'),
      },
    };
  };

  createVAO = gl => {
    /* eslint-disable prettier/prettier */
    // each vertexData consist of `name [range]`: posX [-1.0, 1.0], posY [-1.0, 1.0], textureX [0.0, 1.0], textureY [0.0, 1.0]
    const verticesData = [
      -1.0, -1.0, 0.0, 0.0, // bottom-left
      +1.0, -1.0, 1.0, 0.0, // bottom-right
      +1.0, +1.0, 1.0, 1.0, // top-right
      -1.0, +1.0, 0.0, 1.0, // top-left
    ];
    const verticesIndices = [
      0, 1, 3, // first triangle
      1, 2, 3, // second triangle
    ];
    /* eslint-enable */

    // Create Vertex Array Object
    const VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    const VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesData), gl.STATIC_DRAW);

    const EBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(verticesIndices), gl.STATIC_DRAW);

    gl.bindVertexArray(0);
    return VAO;
  };

  createCameraStream = async gl => {
    const { program, attribLocations, uniformLocations } = this.createGLProgram(gl);
    checkGLError(gl, 'CREATE PROGRAM');
    const VAO = this.createVAO(gl);
    checkGLError(gl, 'CREATE BUFFERS');

    const texture = await AR.getCameraTextureAsync();

    return {
      draw: () => {
        gl.useProgram(program);
        checkGLError(gl, 'USE PROGRAM');

        gl.bindVertexArray(VAO); // That would bind VBO and EBO
        checkGLError(gl, 'BIND VAO');

        const { vertexCoord, textureCoord } = attribLocations;
        const FLOAT_SIZE = 4; // gl.FLOAT takes 4 bytes
        gl.vertexAttribPointer(vertexCoord, 2, gl.FLOAT, false, 4 * FLOAT_SIZE, 0);
        gl.enableVertexAttribArray(vertexCoord);
        gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false, 4 * FLOAT_SIZE, 2 * FLOAT_SIZE);
        gl.enableVertexAttribArray(textureCoord);

        gl.activeTexture(gl.TEXTURE2); // shader program will refer to texture unit 2, so we bind out camera texture to this unit
        checkGLError(gl, 'ACTIVE TEXTURE');
        gl.bindTexture(gl.TEXTURE_2D, texture);
        checkGLError(gl, 'BIND TEXTURE');
        gl.uniform1i(uniformLocations.uSampler, 2); // we bind texture unit 2
        checkGLError(gl, 'PASS TEXTURE');

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); // 6 vertices, each targeted by Uint16 that is mapped to gl.UNDIGNED_SHORT
        gl.finish();
        checkGLError(gl, 'DRAW ELEMENTS');

        // unbind VAO that nothing is changed
        gl.bindVertexArray(0);
      },
    };
  };

  onGLContextCreate = async gl => {
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
