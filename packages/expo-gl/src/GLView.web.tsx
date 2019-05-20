import invariant from 'invariant';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import { UnavailabilityError, CodedError } from '@unimodules/core';
import {
  BaseGLViewProps,
  GLSnapshot,
  ExpoWebGLRenderingContext,
  SnapshotOptions,
} from './GLView.types';
export { BaseGLViewProps, ExpoWebGLRenderingContext, SnapshotOptions, GLViewProps };

declare const window: Window;

function getImageForAsset(asset: {
  downloadAsync: () => Promise<any>;
  uri?: string;
  localUri?: string;
}): HTMLImageElement | any {
  if (asset != null && typeof asset === 'object' && asset !== null && asset.downloadAsync) {
    const dataURI = asset.localUri || asset.uri || '';
    const image = new Image();
    image.src = dataURI;
    return image;
  }
  return asset;
}

function asExpoContext(gl: ExpoWebGLRenderingContext): WebGLRenderingContext {
  gl.endFrameEXP = function glEndFrameEXP(): void {};

  if (!gl['_expo_texImage2D']) {
    gl['_expo_texImage2D'] = gl.texImage2D;
    gl.texImage2D = (...props: any[]): any => {
      let nextProps = [...props];
      nextProps.push(getImageForAsset(nextProps.pop()));
      return gl['_expo_texImage2D'](...nextProps);
    };
  }

  if (!gl['_expo_texSubImage2D']) {
    gl['_expo_texSubImage2D'] = gl.texSubImage2D;
    gl.texSubImage2D = (...props: any[]): any => {
      let nextProps = [...props];
      nextProps.push(getImageForAsset(nextProps.pop()));
      return gl['_expo_texSubImage2D'](...nextProps);
    };
  }

  return gl;
}

function ensureContext(
  canvas?: HTMLCanvasElement,
  contextAttributes?: WebGLContextAttributes
): WebGLRenderingContext {
  if (!canvas) {
    throw new CodedError(
      'ERR_GL_INVALID',
      'Attempting to use the GL context before it has been created.'
    );
  }
  const context =
    canvas.getContext('webgl', contextAttributes) ||
    canvas.getContext('webgl-experimental', contextAttributes) ||
    canvas.getContext('experimental-webgl', contextAttributes);
  invariant(context, 'Browser does not support WebGL');
  return asExpoContext(context as ExpoWebGLRenderingContext);
}

function stripNonDOMProps(props: { [key: string]: any }): { [key: string]: any } {
  for (let k in propTypes) {
    if (k in props) {
      delete props[k];
    }
  }
  return props;
}

const propTypes = {
  onContextCreate: PropTypes.func.isRequired,
  onContextRestored: PropTypes.func,
  onContextLost: PropTypes.func,
  webglContextAttributes: PropTypes.object,
};

interface GLViewProps extends BaseGLViewProps {
  onContextCreate: (gl: WebGLRenderingContext) => void;
  onContextRestored?: (gl?: WebGLRenderingContext) => void;
  onContextLost?: () => void;
  webglContextAttributes?: WebGLContextAttributes;
}

type State = {
  width: number;
  height: number;
};

export class GLView extends React.Component<GLViewProps, State> {
  state = {
    width: 0,
    height: 0,
  };

  static propTypes = propTypes;

  _hasContextBeenCreated = false;

  _webglContextAttributes: WebGLContextAttributes | undefined;

  canvas: HTMLCanvasElement | undefined;

  container?: HTMLElement;

  gl?: WebGLRenderingContext;

  static async createContextAsync(): Promise<WebGLRenderingContext> {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    return ensureContext(canvas);
  }

  static async destroyContextAsync(exgl?: WebGLRenderingContext | number): Promise<boolean> {
    // Do nothing
    return true;
  }

  static async takeSnapshotAsync(
    exgl: WebGLRenderingContext,
    options: SnapshotOptions = {}
  ): Promise<GLSnapshot> {
    invariant(exgl, 'GLView.takeSnapshotAsync(): canvas is not defined');
    const canvas: HTMLCanvasElement = exgl.canvas;
    return await new Promise(resolve => {
      canvas.toBlob(
        (blob: Blob | null) => {
          // TODO: Bacon: Should we add data URI?
          resolve({
            uri: blob,
            localUri: '',
            width: canvas.width,
            height: canvas.height,
          });
        },
        options.format,
        options.compress
      );
    });
  }

  componentDidMount() {
    if (window.addEventListener) {
      window.addEventListener('resize', this._updateLayout);
    }
  }

  _contextCreated = (): void => {
    this.gl = this._createContext();
    this.props.onContextCreate(this.gl);
    if (this.canvas) {
      this.canvas.addEventListener('webglcontextlost', this._contextLost);
      this.canvas.addEventListener('webglcontextrestored', this._contextRestored);
    }
  };

  componentWillUnmount() {
    if (this.gl) {
      const loseContextExt = this.gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
      this.gl = undefined;
    }
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this._contextLost);
      this.canvas.removeEventListener('webglcontextrestored', this._contextRestored);
    }
    window.removeEventListener('resize', this._updateLayout);
  }

  _updateLayout = (): void => {
    if (this.container) {
      const { clientWidth: width = 0, clientHeight: height = 0 } = this.container;
      this.setState({ width, height });
    }
  };

  render() {
    const { devicePixelRatio = 1 } = window;
    const { style, ...props } = this.props;
    const { width, height } = this.state;
    const domProps = stripNonDOMProps(props);

    const containerStyle: any = StyleSheet.flatten([{ flex: 1 }, style]);
    return (
      <div ref={this._assignContainerRef} style={containerStyle}>
        <canvas
          ref={this._assignCanvasRef}
          style={{ flex: 1, width, height }}
          width={width * devicePixelRatio}
          height={height * devicePixelRatio}
          {...domProps}
        />
      </div>
    );
  }

  componentDidUpdate() {
    if (this.canvas && !this._hasContextBeenCreated) {
      this._hasContextBeenCreated = true;
      this._contextCreated();
    }
  }

  _createContext(): WebGLRenderingContext {
    const { webglContextAttributes } = this.props;
    const gl = ensureContext(this.canvas, webglContextAttributes);
    this._webglContextAttributes = webglContextAttributes || {};
    return gl;
  }

  _getGlOrReject(): WebGLRenderingContext {
    if (!this.gl) {
      throw new CodedError(
        'ERR_GL_INVALID',
        'Attempting to use the GL context before it has been created.'
      );
    }
    return this.gl;
  }

  _contextLost = (event: Event): void => {
    event.preventDefault();
    this.gl = undefined;
    if (this.props.onContextLost) {
      this.props.onContextLost();
    }
  };

  _contextRestored = (): void => {
    if (this.props.onContextRestored) {
      this.gl = this._createContext();
      this.props.onContextRestored(this.gl);
    }
  };

  _assignCanvasRef = (canvas: HTMLCanvasElement): void => {
    this.canvas = canvas;
  };

  _assignContainerRef = (element: HTMLElement | null): void => {
    if (element) {
      this.container = element;
    } else {
      this.container = undefined;
    }
    this._updateLayout();
  };

  async takeSnapshotAsync(options: SnapshotOptions = {}): Promise<GLSnapshot> {
    if (!GLView.takeSnapshotAsync) {
      throw new UnavailabilityError('expo-gl', 'takeSnapshotAsync');
    }

    const gl = this._getGlOrReject();

    return await GLView.takeSnapshotAsync(gl, options);
  }

  async startARSessionAsync(): Promise<void> {
    throw new UnavailabilityError('GLView', 'startARSessionAsync');
  }

  async createCameraTextureAsync(): Promise<void> {
    throw new UnavailabilityError('GLView', 'createCameraTextureAsync');
  }

  async destroyObjectAsync(glObject: WebGLObject): Promise<void> {
    throw new UnavailabilityError('GLView', 'destroyObjectAsync');
  }
}
