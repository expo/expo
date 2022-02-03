import {
  NativeModulesProxy,
  UnavailabilityError,
  requireNativeViewManager,
  CodedError,
} from 'expo-modules-core';
import * as React from 'react';
import { Platform, View, findNodeHandle } from 'react-native';

import { configureLogging } from './GLUtils';
import {
  ComponentOrHandle,
  SurfaceCreateEvent,
  GLSnapshot,
  ExpoWebGLRenderingContext,
  SnapshotOptions,
  BaseGLViewProps,
} from './GLView.types';

export interface WebGLObject {
  id: number;
}

declare let global: any;

const { ExponentGLObjectManager, ExponentGLViewManager } = NativeModulesProxy;

export type GLViewProps = {
  /**
   * Called when the OpenGL context is created, with the context object as a parameter. The context
   * object has an API mirroring WebGL's WebGLRenderingContext.
   */
  onContextCreate(gl: ExpoWebGLRenderingContext): void;

  /**
   * [iOS only] Number of samples for Apple's built-in multisampling.
   */
  msaaSamples: number;

  /**
   * A ref callback for the native GLView
   */
  nativeRef_EXPERIMENTAL?(callback: ComponentOrHandle | null);
} & BaseGLViewProps;

const NativeView = requireNativeViewManager('ExponentGLView');

/**
 * A component that acts as an OpenGL render target
 */
export class GLView extends React.Component<GLViewProps> {
  static NativeView: any;

  static defaultProps = {
    msaaSamples: 4,
  };

  static async createContextAsync(): Promise<ExpoWebGLRenderingContext> {
    const { exglCtxId } = await ExponentGLObjectManager.createContextAsync();
    return getGl(exglCtxId);
  }

  static async destroyContextAsync(exgl?: ExpoWebGLRenderingContext | number): Promise<boolean> {
    const exglCtxId = getContextId(exgl);
    return ExponentGLObjectManager.destroyContextAsync(exglCtxId);
  }

  static async takeSnapshotAsync(
    exgl?: ExpoWebGLRenderingContext | number,
    options: SnapshotOptions = {}
  ): Promise<GLSnapshot> {
    const exglCtxId = getContextId(exgl);
    return ExponentGLObjectManager.takeSnapshotAsync(exglCtxId, options);
  }

  static getWorkletContext: (contextId: number) => ExpoWebGLRenderingContext | undefined =
    (function () {
      try {
        // reanimated needs to be imported before any workletized code
        // is created, but we don't want to make it dependency on expo-gl.
        require('react-native-reanimated');
        return (contextId: number): ExpoWebGLRenderingContext | undefined => {
          'worklet';
          return global.__EXGLContexts?.[String(contextId)];
        };
      } catch {
        return () => {
          throw new Error('Worklet runtime is not available');
        };
      }
    })();

  nativeRef: ComponentOrHandle = null;
  exglCtxId?: number;

  render() {
    const {
      onContextCreate, // eslint-disable-line no-unused-vars
      msaaSamples,
      ...viewProps
    } = this.props;

    return (
      <View {...viewProps}>
        <NativeView
          ref={this._setNativeRef}
          style={{
            flex: 1,
            ...(Platform.OS === 'ios'
              ? {
                  backgroundColor: 'transparent',
                }
              : {}),
          }}
          onSurfaceCreate={this._onSurfaceCreate}
          msaaSamples={Platform.OS === 'ios' ? msaaSamples : undefined}
        />
      </View>
    );
  }

  _setNativeRef = (nativeRef: ComponentOrHandle): void => {
    if (this.props.nativeRef_EXPERIMENTAL) {
      this.props.nativeRef_EXPERIMENTAL(nativeRef);
    }
    this.nativeRef = nativeRef;
  };

  _onSurfaceCreate = ({ nativeEvent: { exglCtxId } }: SurfaceCreateEvent): void => {
    const gl = getGl(exglCtxId);

    this.exglCtxId = exglCtxId;

    if (this.props.onContextCreate) {
      this.props.onContextCreate(gl);
    }
  };

  async startARSessionAsync(): Promise<any> {
    if (!ExponentGLViewManager.startARSessionAsync) {
      throw new UnavailabilityError('expo-gl', 'startARSessionAsync');
    }
    return await ExponentGLViewManager.startARSessionAsync(findNodeHandle(this.nativeRef));
  }

  async createCameraTextureAsync(cameraRefOrHandle: ComponentOrHandle): Promise<WebGLTexture> {
    if (!ExponentGLObjectManager.createCameraTextureAsync) {
      throw new UnavailabilityError('expo-gl', 'createCameraTextureAsync');
    }

    const { exglCtxId } = this;

    if (!exglCtxId) {
      throw new Error("GLView's surface is not created yet!");
    }

    const cameraTag = findNodeHandle(cameraRefOrHandle);
    const { exglObjId } = await ExponentGLObjectManager.createCameraTextureAsync(
      exglCtxId,
      cameraTag
    );
    return { id: exglObjId } as WebGLTexture;
  }

  async destroyObjectAsync(glObject: WebGLObject): Promise<boolean> {
    if (!ExponentGLObjectManager.destroyObjectAsync) {
      throw new UnavailabilityError('expo-gl', 'destroyObjectAsync');
    }
    return await ExponentGLObjectManager.destroyObjectAsync(glObject.id);
  }

  async takeSnapshotAsync(options: SnapshotOptions = {}): Promise<GLSnapshot> {
    if (!GLView.takeSnapshotAsync) {
      throw new UnavailabilityError('expo-gl', 'takeSnapshotAsync');
    }
    const { exglCtxId } = this;
    return await GLView.takeSnapshotAsync(exglCtxId, options);
  }
}

GLView.NativeView = NativeView;

// Get the GL interface from an EXGLContextId
const getGl = (exglCtxId: number): ExpoWebGLRenderingContext => {
  if (!global.__EXGLContexts) {
    throw new CodedError(
      'ERR_GL_NOT_AVAILABLE',
      'GL is currently not available. (Have you enabled remote debugging? GL is not available while debugging remotely.)'
    );
  }
  const gl = global.__EXGLContexts[String(exglCtxId)];

  configureLogging(gl);

  return gl;
};

const getContextId = (exgl?: ExpoWebGLRenderingContext | number): number => {
  const exglCtxId = exgl && typeof exgl === 'object' ? exgl.contextId : exgl;

  if (!exglCtxId || typeof exglCtxId !== 'number') {
    throw new Error(`Invalid EXGLContext id: ${String(exglCtxId)}`);
  }
  return exglCtxId;
};
