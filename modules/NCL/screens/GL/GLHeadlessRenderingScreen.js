import React from 'react';
import { GLView } from 'expo-gl';
import { Asset } from 'expo-asset';
import { FileSystem } from 'expo-file-system';
import { Image, Slider, StyleSheet, Text, View } from 'react-native';

import exampleImage from '../../assets/images/example3.jpg';

const vertShaderSource = `#version 300 es
precision mediump float;

in vec2 position;
out vec2 textureCoord;

void main() {
  vec2 clipSpace = (1.0 - 2.0 * position) * vec2(-1.0, -1.0);

  textureCoord = position;
  gl_Position = vec4(clipSpace, 0.0, 1.0);
}`;

const fragShaderSource = `#version 300 es
precision mediump float;

uniform sampler2D inputImageTexture;
uniform float contrast;

in vec2 textureCoord;
out vec4 fragColor;

void main() {
  vec4 textureColor = texture(inputImageTexture, textureCoord);
  vec3 rgb = (textureColor.rgb - vec3(0.5)) * contrast + vec3(0.5);

  fragColor = vec4(rgb, textureColor.a);
}`;

// location to contrast uniform
let contrastLocation;

// create and prepare GL context
const glPromise = GLView.createContextAsync().then(async gl => {
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

  contrastLocation = gl.getUniformLocation(program, 'contrast');

  // create framebuffer
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  // Create, bind, fill buffer
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const verts = new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  // Bind 'position' attribute
  const positionAttrib = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionAttrib);
  gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

  // download an asset
  const asset = Asset.fromModule(exampleImage);
  await asset.downloadAsync();

  // set viewport
  gl.viewport(0, 0, asset.width, asset.height);

  // create output texture
  const outputTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, outputTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    asset.width,
    asset.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );

  // create input texture
  const inputTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);

  // attach texture to framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

  // set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  // fill up input texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset);
  gl.uniform1i(gl.getUniformLocation(program, 'inputImageTexture'), 1);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  return gl;
});

export default class GLHeadlessRenderingScreen extends React.PureComponent {
  static title = 'Headless rendering';

  isDrawing = false;

  state = {
    contrast: 1.0,
    snapshot: null,
  };

  componentDidMount() {
    this.draw();
  }

  async draw() {
    if (this.isDrawing) {
      // if another draw call is already running, we need to skip this one
      return;
    }

    this.isDrawing = true;

    const gl = await glPromise;

    gl.uniform1f(contrastLocation, this.state.contrast);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.endFrameEXP();

    // we need to use flip option because framebuffer contents are flipped vertically
    const snapshot = await GLView.takeSnapshotAsync(gl, {
      flip: true,
    });

    // delete previous snapshot
    if (this.state.snapshot) {
      FileSystem.deleteAsync(this.state.snapshot.uri, { idempotent: true });
    }

    this.setState({ snapshot });
    this.isDrawing = false;
  }

  onContrastChange = contrast => {
    this.setState({ contrast }, () => {
      this.draw();
    });
  };

  render() {
    const { contrast, snapshot } = this.state;

    return (
      <View style={styles.container}>
        <Text>
          This example shows how to use headless rendering context with Expo.GLView. Instead of the
          GLView, it renders snapshots taken from headless context that sits on top of the app and
          can be reused in multiple components without redundant shader recompilations.
        </Text>
        <View style={styles.flex}>
          {snapshot && (
            <Image
              style={styles.flex}
              fadeDuration={0}
              source={{ uri: snapshot.uri }}
              resizeMode="contain"
            />
          )}
        </View>
        <Text style={styles.sliderHeader}>{`Contrast: ${parseInt(contrast * 100, 10)}%`}</Text>
        <Slider
          value={contrast}
          step={0.01}
          minimumValue={0}
          maximumValue={2}
          onValueChange={this.onContrastChange}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  flex: {
    flex: 1,
    width: '100%',
  },
  sliderHeader: {
    paddingHorizontal: 10,
  },
});
