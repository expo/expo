import React from 'react';
import { GLView } from 'expo-gl';

const Browser = require('processing-js/lib/Browser');
Browser.window = window;
const Processing = require('processing-js/src')(Browser);

export class ProcessingView extends React.Component {
  componentWillUnmount() {
    if (this._p) {
      this._p.exit();
      this._p = null;
    }
    cancelAnimationFrame(this._rafID);
  }

  render() {
    const { sketch, ...props } = this.props;
    return <GLView {...props} onContextCreate={this._onGLContextCreate} />;
  }

  _onGLContextCreate = gl => {
    // Canvas polyfilling

    let canvas = Browser.document.createElement('canvas');

    canvas.getContext = () => gl;

    // Cache uniform and attrib locations

    const origGetUniformLocation = gl.getUniformLocation;
    gl.getUniformLocation = (program, name) => {
      if (!program.uniformLocationCache) {
        program.uniformLocationCache = {};
      }
      let loc = program.uniformLocationCache[name];
      if (loc !== undefined) {
        return loc;
      }
      loc = origGetUniformLocation.call(gl, program, name);
      program.uniformLocationCache[name] = loc;
      return loc;
    };

    const origGetAttribLocation = gl.getAttribLocation;
    gl.getAttribLocation = (program, name) => {
      if (!program.attribLocationCache) {
        program.attribLocationCache = {};
      }
      let loc = program.attribLocationCache[name];
      if (loc !== undefined) {
        return loc;
      }
      loc = origGetAttribLocation.call(gl, program, name);
      program.attribLocationCache[name] = loc;
      return loc;
    };

    // Call `gl.endFrameEXP()` every frame

    const keepFlushing = () => {
      gl.endFrameEXP();
      this._rafID = requestAnimationFrame(keepFlushing);
    };
    keepFlushing();

    // The Processing sketch

    new Processing(canvas, p => {
      this._p = p;

      // Force render viewport size / mode
      p.size(gl.drawingBufferWidth, gl.drawingBufferHeight, p.WEBGL);
      p.size = () => {};

      // Run user's sketch
      if (this.props.sketch) {
        this.props.sketch(p);
      } else {
        p.draw = () => {};
      }
    });
  };
}
