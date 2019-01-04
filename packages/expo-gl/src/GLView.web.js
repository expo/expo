// @flow
import PropTypes from 'prop-types';
import * as React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { UnavailabilityError } from 'expo-errors';
import type { SnapshotOptions } from './GLView.types';

type Props = {
  /**
   * Called when the OpenGL context is created, with the context object as a parameter. The context
   * object has an API mirroring WebGL's WebGLRenderingContext.
   */
  onContextCreate?: (gl: *) => void,
};

/**
 * A component that acts as an OpenGL render target
 */
let contextCache = {};

function _getImageForAsset(asset) {
  if (asset == null) return null;

  if (typeof asset === 'object' && asset !== null && asset.downloadAsync) {
    const uri = asset.localUri || asset.uri;
    const img = new Image();
    img.src = uri;
    // await new Promise(resolve => (img.onload = resolve));
    return img;
  }
  return asset;
}

function asExpoContext(gl: WebGLRenderingContext) {
  gl.endFrameEXP = function glEndFrameEXP() {};

  if (!gl._expo_texImage2D) {
    gl._expo_texImage2D = gl.texImage2D;
    gl.texImage2D = (...props) => {
      let nextProps = [...props];
      nextProps.push(_getImageForAsset(nextProps.pop()));
      return gl._expo_texImage2D(...nextProps);
    };
  }

  if (!gl._expo_texSubImage2D) {
    gl._expo_texSubImage2D = gl.texSubImage2D;
    gl.texSubImage2D = async (...props) => {
      let nextProps = [...props];
      nextProps.push(await _getImageForAsset(nextProps.pop()));
      return gl._expo_texSubImage2D(...nextProps);
    };
  }

  return gl;
}
export default class GLView extends React.Component<Props> {
  static propTypes = {
    onContextCreate: PropTypes.func,
  };

  state = {
    width: undefined,
    height: undefined,
  };

  nativeRef: ?HTMLCanvasElement;

  static async createContextAsync() {
    const { width, height, scale } = Dimensions.get('window');
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    return asExpoContext(canvas.getContext('webgl'));
  }

  static async destroyContextAsync(exgl: WebGLRenderingContext | ?number) {
    const exglCtxId = getContextId(exgl);
    if (exglCtxId in contextCache) {
      document.removeChild(contextCache[exglCtxId]);
      contextCache[exglCtxId] = undefined;
    }
  }

  static async takeSnapshotAsync(
    exgl: WebGLRenderingContext | ?number,
    options: SnapshotOptions = {}
  ) {
    throw new UnavailabilityError('GLView', 'takeSnapshotAsync');
  }

  componentDidMount() {
    this._isMounted = true;
    this._tryOnContextCreate();
    window.addEventListener('resize', this._onLayout);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this._onLayout);
  }

  _onLayout = () => {
    this.setState({
      width: this.width,
      height: this.height,
    });
  };

  get scale() {
    return window.devicePixelRatio;
  }

  get x() {
    return this.wrapperRef.screenX;
  }
  get y() {
    return this.wrapperRef.screenY;
  }

  get width() {
    if (!this.wrapperRef) return 1;
    return this.wrapperRef.clientWidth;
  }

  get height() {
    if (!this.wrapperRef) return 1;
    return this.wrapperRef.clientHeight;
  }

  _tryOnContextCreate = () => {
    if (this._isMounted && !!this.nativeRef && !!this.wrapperRef) {
      this._onContextCreate();
    }
  };
  _onContextCreate = async () => {
    if (this._onContextCreated) return;

    this._onContextCreated = true;
    const { onContextCreate } = this.props;

    if (onContextCreate) {
      await new Promise(resolve => setTimeout(resolve));

      const gl = asExpoContext(this.nativeRef.getContext('webgl2'));
      onContextCreate(gl);
    }
  };

  render() {
    const { onContextCreate, sketch, style, ...props } = this.props;

    const { width = 1, height = 1 } = this.state;

    return (
      <div style={StyleSheet.flatten([{ flex: 1 }, style])} ref={this._setWrapperRef}>
        <canvas
          style={{ flex: 1, maxWidth: width, maxHeight: height }}
          resize="true"
          {...props}
          width={width * this.scale}
          height={height * this.scale}
          ref={this._setNativeRef}
        />
      </div>
    );
  }

  _setWrapperRef = (nativeRef: HTMLCanvasElement) => {
    this.wrapperRef = nativeRef;
    this._onLayout();
    this._tryOnContextCreate();
  };

  _setNativeRef = (nativeRef: HTMLCanvasElement) => {
    this.nativeRef = nativeRef;
    this._tryOnContextCreate();
  };

  startARSessionAsync() {
    throw new UnavailabilityError('GLView', 'startARSessionAsync');
  }

  async createCameraTextureAsync() {
    throw new UnavailabilityError('GLView', 'createCameraTextureAsync');
  }

  destroyObjectAsync(glObject: WebGLObject) {
    throw new UnavailabilityError('GLView', 'destroyObjectAsync');
  }
}

const getContextId = (exgl: WebGLRenderingContext | ?number) => {
  const exglCtxId = exgl && typeof exgl === 'object' ? exgl.__exglCtxId : exgl;

  if (!exglCtxId || typeof exglCtxId !== 'number') {
    throw new Error(`Invalid EXGLContext id: ${String(exglCtxId)}`);
  }
  return exglCtxId;
};
