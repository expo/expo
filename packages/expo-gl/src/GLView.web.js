// @flow
import invariant from 'invariant';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import { UnavailabilityError } from 'expo-errors';

function getImageForAsset(asset: any | null): any {
  if (asset == null) {
    return null;
  }

  if (typeof asset === 'object' && asset !== null && asset.downloadAsync) {
    const dataURI = asset.localUri || asset.uri;
    const image = new Image();
    image.src = dataURI;
    return image;
  }
  return asset;
}

function asExpoContext(gl: WebGLRenderingContext): WebGLRenderingContext {
  gl.endFrameEXP = function glEndFrameEXP(): void {};

  if (!gl._expo_texImage2D) {
    gl._expo_texImage2D = gl.texImage2D;
    gl.texImage2D = (...props) => {
      let nextProps = [...props];
      nextProps.push(getImageForAsset(nextProps.pop()));
      return gl._expo_texImage2D(...nextProps);
    };
  }

  if (!gl._expo_texSubImage2D) {
    gl._expo_texSubImage2D = gl.texSubImage2D;
    gl.texSubImage2D = (...props) => {
      let nextProps = [...props];
      nextProps.push(getImageForAsset(nextProps.pop()));
      return gl._expo_texSubImage2D(...nextProps);
    };
  }

  return gl;
}

function ensureContext(
  canvas: HTMLCanvasElement,
  contextAttributes?: WebGLContextAttributes
): WebGLRenderingContext {
  const context =
    canvas.getContext('webgl2', contextAttributes) ||
    canvas.getContext('webgl', contextAttributes) ||
    canvas.getContext('webgl-experimental', contextAttributes) ||
    canvas.getContext('experimental-webgl', contextAttributes);
  invariant(context, 'Browser does not support WebGL');
  return asExpoContext(context);
}

function stripNonDOMProps(props): any {
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
  style: PropTypes.object,
};

type Props = {
  onContextCreate: (gl: WebGLRenderingContext) => void,
  onContextRestored: (gl: ?WebGLRenderingContext) => void,
  onContextLost: () => void,
  webglContextAttributes?: WebGLContextAttributes,
  pixelRatio?: number,
  style?: any,
};

type State = {
  width: number,
  height: number,
};
export default class GLView extends React.Component<Props, State> {
  state = {
    width: 0,
    height: 0,
  };

  static propTypes = propTypes;

  _hasContextBeenCreated = false;

  _webglContextAttributes: WebGLContextAttributes | undefined;

  canvas: HTMLCanvasElement | undefined;

  gl: WebGLRenderingContext | undefined;

  static async createContextAsync(): Promise<WebGLRenderingContext> {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    return ensureContext(canvas);
  }

  static async destroyContextAsync(exgl: WebGLRenderingContext | ?number): Promise<void> {
    // Do nothing
  }

  static async takeSnapshotAsync(
    exgl: WebGLRenderingContext,
    options: SnapshotOptions = {}
  ): Promise<void> {
    invariant(exgl, 'GLView.takeSnapshotAsync(): canvas is not defined');
    const canvas: HTMLCanvasElement = exgl.canvas;
    return await new Promise(resolve => canvas.toBlob(resolve, options.format, options.compress));
    //TODO:Bacon: Should we add data URI
    // return canvas.toDataURL(options.format, options.compress);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateLayout);
  }

  _contextCreated = () => {
    this.gl = this._createContext();
    this.props.onContextCreate(this.gl);
    this.canvas.addEventListener('webglcontextlost', this._contextLost);
    this.canvas.addEventListener('webglcontextrestored', this._contextRestored);
  };

  componentWillUnmount() {
    if (this.gl) {
      const loseContextExt = this.gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
      this.gl = null;
    }
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this._contextLost);
      this.canvas.removeEventListener('webglcontextrestored', this._contextRestored);
    }
    window.removeEventListener('resize', this._updateLayout);
  }

  _updateLayout = () => {
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

    return (
      <div ref={this._assignContainerRef} style={StyleSheet.flatten([{ flex: 1 }, style])}>
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

  componentDidUpdate(prev, prevState) {
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

  _contextLost = (event: Event) => {
    event.preventDefault();
    this.gl = null;
    if (this.props.onContextLost) {
      this.props.onContextLost();
    }
  };

  _contextRestored = () => {
    if (this.props.onContextRestored) {
      this.gl = this._createContext();
      this.props.onContextRestored(this.gl);
    }
  };

  _assignCanvasRef = (canvas: HTMLCanvasElement) => {
    this.canvas = canvas;
  };

  _assignContainerRef = (element: HTMLElement) => {
    this.container = element;
    this._updateLayout();
  };

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
