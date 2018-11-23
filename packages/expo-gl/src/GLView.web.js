// @flow

import PropTypes from 'prop-types';
import * as React from 'react';
import { StyleSheet } from 'react-native';

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
export default class GLView extends React.Component<Props> {
  static propTypes = {
    onContextCreate: PropTypes.func,
  };

  state = {
    width: undefined,
    height: undefined,
  };

  nativeRef: ?HTMLCanvasElement;

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
  _onContextCreate = () => {
    if (this._onContextCreated) return;

    this._onContextCreated = true;
    const { onContextCreate } = this.props;

    if (onContextCreate) {
      const gl = this.nativeRef.getContext('webgl');
      onContextCreate({
        gl,
        canvas: this.nativeRef,
        width: this.width,
        height: this.height,
        scale: this.scale,
      });
    }
  };

  render() {
    const {
      onContextCreate,
      style, // eslint-disable-line no-unused-vars
      ...props
    } = this.props;

    const { width = 1, height = 1 } = this.state;

    return (
      <div style={StyleSheet.flatten([{ flex: 1 }, style])} ref={this._setWrapperRef}>
        <canvas
          style={StyleSheet.flatten([{ flex: 1, maxWidth: width, maxHeight: height }])}
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
    throw new Error('GLView.startARSessionAsync: Not Implemented');
  }

  async createCameraTextureAsync() {
    throw new Error('GLView.createCameraTextureAsync: Not Implemented');
  }

  destroyObjectAsync(glObject: WebGLObject) {
    throw new Error('GLView.destroyObjectAsync: Not Implemented');
  }
}
