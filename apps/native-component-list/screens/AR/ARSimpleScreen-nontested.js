import React from 'react';
import {
  AR,
  GLView,
} from 'expo';
import { findNodeHandle, StyleSheet, View } from 'react-native';

console.log('AR:', AR);

export default class ARSimpleScreen extends React.Component {
  static title = 'Simple AR Screen';

  componentDidMount() {
    this.triangles = [];
    AR.onCameraDidChangeTrackingState(tracking => {});

    // (async () => {
    //   this._textureAsset = Expo.Asset.fromModule(require('../assets/icons/icon.png'));
    //   await this._textureAsset.downloadAsync();
    //   this.setState({ ready: true });
    // })();

  }

  componentWillUnmount() {
    AR.removeAllListeners(AR.EventTypes.CameraDidChangeTrackingState);
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <GLView
          ref={ref => (this.glView = ref)}
          style={StyleSheet.absoluteFill}
          onContextCreate={this._onGLContextCreate}
        />
      </View>
    );
  }

  _createCamStream = async gl => {
    // Compile vertex and fragment shaders
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(
      vertShader,
      `
      precision highp float;

      attribute vec2 position;
      varying vec2 uv;

      void main() {
        uv = position;
        gl_Position = vec4(1.0 - 2.0 * position, 0, 0.5);
      }
      `
    );
    gl.compileShader(vertShader);
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(
      fragShader,
      `
      precision highp float;

      uniform sampler2D texture;
      varying vec2 uv;

      void main() {
        gl_FragColor = texture2D(texture, vec2(1) - uv);
      }
      `
    );
    gl.compileShader(fragShader);

    // Link, use program, save and enable attributes
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
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

    // Create texture asynchronously
    await AR.startAsync(findNodeHandle(this.glView.nativeRef), AR.TrackingConfigurations.World);
    const capturedImageTexture = await AR.getCameraTextureAsync();
    const texture = new WebGLTexture(capturedImageTexture);

    // Set 'texture' uniform
    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

    // // Create texture
    // const texture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // gl.texImage2D(
    //   gl.TEXTURE_2D,
    //   0,
    //   gl.RGBA,
    //   128,
    //   128,
    //   0,
    //   gl.RGBA,
    //   gl.UNSIGNED_BYTE,
    //   this._textureAsset
    // );
    // // 1, 1, 0,
    // // gl.RGBA, gl.UNSIGNED_BYTE,
    // // new Uint8Array([255, 0, 0, 255]));
    // gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

    // console.log('texture data: ', { capturedImageTexture, texture });

    return {
      draw: () => {
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
      },
    };
  };

//   _createTriangle = gl => {
//     // Compile vertex and fragment shaders
//     const vertShader = gl.createShader(gl.VERTEX_SHADER);
//     gl.shaderSource(
//       vertShader,
//       `
// precision highp float;
// attribute vec2 position;
// uniform mat4 modMat, viewMat, projMat;
// void main() {
//   gl_Position = projMat * viewMat * modMat * vec4(position, 0, 1);
// }
// `
//     );
//     gl.compileShader(vertShader);
//     const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
//     gl.shaderSource(
//       fragShader,
//       `
// precision highp float;
// void main() {
//   gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
// }
// `
//     );
//     gl.compileShader(fragShader);

//     // Link, use program, save and enable attributes
//     const program = gl.createProgram();
//     gl.attachShader(program, vertShader);
//     gl.attachShader(program, fragShader);
//     gl.linkProgram(program);
//     gl.useProgram(program);
//     const positionAttrib = gl.getAttribLocation(program, 'position');
//     gl.enableVertexAttribArray(positionAttrib);
//     const viewMatUniform = gl.getUniformLocation(program, 'viewMat');
//     const projMatUniform = gl.getUniformLocation(program, 'projMat');
//     const modMatUniform = gl.getUniformLocation(program, 'modMat');

//     // Create, bind, fill buffer
//     const buffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//     const verts = new Float32Array([
//       -0.035,
//       0.035,
//       0.035,
//       0.035,
//       -0.035,
//       -0.035,
//       -0.035,
//       -0.035,
//       0.035,
//       0.035,
//       0.035,
//       -0.035,
//     ]);
//     gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

//     // Bind 'position' attribute
//     gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

//     return {
//       draw: (viewMatrix, projMatrix, modMatrix) => {
//         gl.useProgram(program);
//         gl.enableVertexAttribArray(positionAttrib);
//         gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//         gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
//         gl.uniformMatrix4fv(viewMatUniform, false, new Float32Array(viewMatrix));
//         gl.uniformMatrix4fv(projMatUniform, false, new Float32Array(projMatrix));
//         gl.uniformMatrix4fv(modMatUniform, false, new Float32Array(modMatrix));
//         gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
//       },
//     };
//   };

  _onGLContextCreate = async gl => {
    this.gl = gl;
    this.camStream = await this._createCamStream(gl);
    // const triangle = this._createTriangle(gl);

    // Render loop
    const loop = () => {
      requestAnimationFrame(loop);

      // Clear
      gl.clearColor(0, 0, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Draw camera stream
      this.camStream.draw();

      // Draw scene
      // const matrices = NativeModules.ExponentGLViewManager.getARMatrices(
      //   this.camStream.sessionId,
      //   gl.drawingBufferWidth,
      //   gl.drawingBufferHeight,
      //   0.01,
      //   1000,
      // );
      // this.triangles.map(({ modMat }) =>
      //   triangle.draw(matrices.viewMatrix, matrices.projectionMatrix, modMat),
      // );

      // Submit frame
      gl.endFrameEXP();
    };
    loop();
  };
}
