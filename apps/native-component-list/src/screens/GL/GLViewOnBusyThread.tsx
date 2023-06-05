import { Asset } from 'expo-asset';
import ExpoCheckbox from 'expo-checkbox';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, View, TouchableHighlight } from 'react-native';
import { runOnUI } from 'react-native-reanimated';

async function onContextCreate(gl: ExpoWebGLRenderingContext) {
  const vert = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(
    vert,
    `
  precision highp float;
  attribute vec2 position;
  varying vec2 uv;
  void main () {
    uv = position;
    gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
  }`
  );
  gl.compileShader(vert);
  const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(
    frag,
    `
  precision highp float;
  uniform sampler2D texture;
  varying vec2 uv;
  void main () {
    gl_FragColor = texture2D(texture, vec2(uv.x, uv.y));
  }`
  );
  gl.compileShader(frag);

  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const verts = new Float32Array([-2, 0, 0, -2, 2, 2]);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  const positionAttrib = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionAttrib);
  gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

  const asset = Asset.fromModule(require('../../../assets/images/nikki.png'));
  await asset.downloadAsync();
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset as any);
  gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);
  gl.clearColor(0, 0, 1, 1);
  // tslint:disable-next-line: no-bitwise
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
  gl.endFrameEXP();
}

function BusyJSThreadSelector() {
  const [fakeBusyJSThread, setFakeBusyJSThread] = useState(false);
  useEffect(() => {
    if (!fakeBusyJSThread) {
      return;
    }
    const interval = setInterval(() => {
      let test_value = 0;
      const start = Date.now();
      while (Date.now() - start < 990) {
        test_value += Math.random();
      }
      console.log(`js - ${test_value}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [fakeBusyJSThread]);

  return (
    <View style={styles.checkboxRow}>
      <ExpoCheckbox
        onValueChange={() => setFakeBusyJSThread(!fakeBusyJSThread)}
        value={fakeBusyJSThread}
      />
      <Text style={styles.text}>fake work on js thread</Text>
    </View>
  );
}

function BusyWorkletThreadSelector() {
  const [fakeBusyWorkletThread, setFakeBusyWorkletThread] = useState(true);
  useEffect(() => {
    if (!fakeBusyWorkletThread) {
      return;
    }
    const interval = setInterval(() => {
      runOnUI(() => {
        'worklet';
        let test_value = 0;
        const start = Date.now();
        while (Date.now() - start < 990) {
          test_value += Math.random();
        }
        console.log(`worklet - ${test_value}`);
      })();
    }, 1000);
    return () => clearInterval(interval);
  }, [fakeBusyWorkletThread]);

  return (
    <View style={styles.checkboxRow}>
      <ExpoCheckbox
        onValueChange={() => setFakeBusyWorkletThread(!fakeBusyWorkletThread)}
        value={fakeBusyWorkletThread}
      />
      <Text style={styles.text}>fake work on worklet thread</Text>
    </View>
  );
}

export default function GLViewOnBusyThread() {
  const [show, setShow] = useState(true);
  return (
    <View style={styles.flex}>
      <Text style={styles.text}>
        This screen is expected to lag. It's faking work on JS and worklet threads. Toggle GLView
        few times to make sure it does no crash.
      </Text>
      <BusyWorkletThreadSelector />
      <BusyJSThreadSelector />

      {show ? (
        <View style={styles.flexWrap}>
          {[...Array(90)].map(() => (
            <GLView
              style={styles.view}
              onContextCreate={onContextCreate}
              enableExperimentalWorkletSupport
            />
          ))}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text>no gl view</Text>
        </View>
      )}
      <TouchableHighlight
        underlayColor="#0176d3"
        style={styles.button}
        onPress={() => setShow(!show)}>
        <Text style={styles.buttonText}>TOGGLE</Text>
      </TouchableHighlight>
    </View>
  );
}

GLViewOnBusyThread.title = 'Creating GLView when a thread is busy';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  view: {
    width: 40,
    height: 40,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    padding: 10,
    fontSize: 16,
  },
  buttonText: {
    fontSize: 22,
  },
  button: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    marginTop: 10,
  },
});
