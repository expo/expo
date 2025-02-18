'use strict';
import { Asset } from 'expo-asset';
import { GLView } from 'expo-gl';
import { Platform } from 'expo-modules-core';
import React from 'react';

import { mountAndWaitFor } from './helpers';

export const name = 'GLView';
const style = { width: 200, height: 200 };

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  let instance = null;
  let originalTimeout;

  const refSetter = (ref) => {
    instance = ref;
  };

  beforeAll(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 3;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  afterEach(async () => {
    instance = null;
    await cleanupPortal();
  });

  function getContextAsync() {
    return new Promise(async (resolve) => {
      await mountAndWaitFor(
        <GLView onContextCreate={(context) => resolve(context)} ref={refSetter} style={style} />,
        'onContextCreate',
        setPortalChild
      );
    });
  }

  describe('GLView', () => {
    it('gets a valid context', async () => {
      const context = await getContextAsync();
      expect(
        context instanceof WebGLRenderingContext || context instanceof WebGL2RenderingContext
      ).toBe(true);
    });

    it('takes a snapshot', async () => {
      await getContextAsync();

      const snapshot = await instance.takeSnapshotAsync({ format: 'png' });
      expect(snapshot).toBeDefined();
      if (Platform.OS === 'web') {
        expect(snapshot.uri instanceof Blob).toBe(true);
      } else {
        expect(snapshot.uri).toMatch(/^file:\/\//);
        expect(snapshot.localUri).toMatch(/^file:\/\//);
      }
    });

    describe('context', () => {
      const vertexShader = `
        precision highp float;
        attribute vec2 position;
        varying vec2 uv;
        void main () {
          uv = position;
          gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
        }`;
      const fragShader = `
        precision highp float;
    uniform sampler2D texture;
    varying vec2 uv;
    void main () {
      gl_FragColor = texture2D(texture, vec2(uv.x, uv.y));
    }
        `;
      it('has Expo methods', async () => {
        const context = await getContextAsync();
        expect(typeof context.endFrameEXP).toBe('function');
      });
      it('clears to blue without throwing', async () => {
        const gl = await getContextAsync();
        gl.clearColor(0, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.endFrameEXP();
      });

      it(`draws a texture`, async () => {
        const gl = await getContextAsync();

        const vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertexShader);
        gl.compileShader(vert);
        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragShader);
        gl.compileShader(frag);

        const program = gl.createProgram();
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

        const asset = Asset.fromModule(require('../assets/qrcode_expo.jpg'));
        await asset.downloadAsync();
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset);
        gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

        gl.clearColor(0, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
        gl.endFrameEXP();
      });

      it(`draws a compressed texture`, async () => {
        const gl = await getContextAsync();

        const vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertexShader);
        gl.compileShader(vert);
        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragShader);
        gl.compileShader(frag);

        const program = gl.createProgram();
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

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.compressedTexImage2D(
          gl.TEXTURE_2D,
          0,
          gl.COMPRESSED_R11_EAC,
          32,
          32,
          0,
          new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 128, 128, 0, 255])
        );
        gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

        gl.clearColor(0, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
        gl.endFrameEXP();
      });

      it(`draws a texture with a TypedArray`, async () => {
        const gl = await getContextAsync();

        const vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertexShader);

        gl.compileShader(vert);
        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragShader);
        gl.compileShader(frag);

        const program = gl.createProgram();
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

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        // Use below to test using a `TypedArray` parameter
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          32,
          32,
          2,
          2,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 128, 128, 0, 255])
        );

        gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

        gl.clearColor(0, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
        gl.endFrameEXP();
      });

      it(`draws a compressed texture with a TypedArray`, async () => {
        const gl = await getContextAsync();

        const vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertexShader);

        gl.compileShader(vert);
        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragShader);
        gl.compileShader(frag);

        const program = gl.createProgram();
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

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        // Use below to test using a `TypedArray` parameter
        gl.compressedTexSubImage2D(
          gl.TEXTURE_2D,
          0,
          32,
          32,
          2,
          2,
          gl.COMPRESSED_R11_EAC,
          new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 128, 128, 0, 255])
        );

        gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

        gl.clearColor(0, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
        gl.endFrameEXP();
      });
    });

    describe('static', () => {
      it('creates a static context', async () => {
        const context = await GLView.createContextAsync();
        expect(
          context instanceof WebGLRenderingContext || context instanceof WebGL2RenderingContext
        ).toBe(true);
      });

      it('takes a snapshot', async () => {
        const context = await getContextAsync();

        const snapshot = await GLView.takeSnapshotAsync(context, { format: 'png' });
        expect(snapshot).toBeDefined();

        if (Platform.OS === 'web') {
          expect(snapshot.uri instanceof Blob).toBe(true);
        } else {
          expect(snapshot.uri).toMatch(/^file:\/\//);
          expect(snapshot.localUri).toMatch(/^file:\/\//);
        }
      });
    });
  });
}
