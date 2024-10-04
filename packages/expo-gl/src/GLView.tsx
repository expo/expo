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
  GLViewProps,
} from './GLView.types';
import { createWorkletContextProvider } from './GLWorkletContextProvider';

// @docsMissing
export type WebGLObject = {
  id: number;
};

declare let global: any;

const { ExponentGLObjectManager, ExponentGLViewManager } = NativeModulesProxy;

const NativeView = requireNativeViewManager('ExponentGLView');

// @needsAudit
/**
 * A View that acts as an OpenGL ES render target. On mounting, an OpenGL ES context is created.
 * Its drawing buffer is presented as the contents of the View every frame.
 */
export class GLView extends React.Component<GLViewProps> {
  static NativeView: any;

  static defaultProps = {
    msaaSamples: 4,
  };

  /**
   * Imperative API that creates headless context which is devoid of underlying view.
   * It's useful for headless rendering or in case you want to keep just one context per application and share it between multiple components.
   * It is slightly faster than usual context as it doesn't swap framebuffers and doesn't present them on the canvas,
   * however it may require you to take a snapshot in order to present its results.
   * Also, keep in mind that you need to set up a viewport and create your own framebuffer and texture that you will be drawing to, before you take a snapshot.
   * @return A promise that resolves to WebGL context object. See [WebGL API](#webgl-api) for more details.
   */
  static async createContextAsync(): Promise<ExpoWebGLRenderingContext> {
    const { exglCtxId } = await ExponentGLObjectManager.createContextAsync();
    return getGl(exglCtxId);
  }

  /**
   * Destroys given context.
   * @param exgl WebGL context to destroy.
   * @return A promise that resolves to boolean value that is `true` if given context existed and has been destroyed successfully.
   */
  static async destroyContextAsync(exgl?: ExpoWebGLRenderingContext | number): Promise<boolean> {
    const exglCtxId = getContextId(exgl);
    return ExponentGLObjectManager.destroyContextAsync(exglCtxId);
  }

  /**
   * Takes a snapshot of the framebuffer and saves it as a file to app's cache directory.
   * @param exgl WebGL context to take a snapshot from.
   * @param options
   * @return A promise that resolves to `GLSnapshot` object.
   */
  static async takeSnapshotAsync(
    exgl?: ExpoWebGLRenderingContext | number,
    options: SnapshotOptions = {}
  ): Promise<GLSnapshot> {
    const exglCtxId = getContextId(exgl);
    return ExponentGLObjectManager.takeSnapshotAsync(exglCtxId, options);
  }

  static getWorkletContext: (contextId: number) => ExpoWebGLRenderingContext | undefined =
    createWorkletContextProvider();

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

  // @docsMissing
  async startARSessionAsync(): Promise<any> {
    if (!ExponentGLViewManager.startARSessionAsync) {
      throw new UnavailabilityError('expo-gl', 'startARSessionAsync');
    }
    return await ExponentGLViewManager.startARSessionAsync(findNodeHandle(this.nativeRef));
  }

  // @docsMissing
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

  // @docsMissing
  async destroyObjectAsync(glObject: WebGLObject): Promise<boolean> {
    if (!ExponentGLObjectManager.destroyObjectAsync) {
      throw new UnavailabilityError('expo-gl', 'destroyObjectAsync');
    }
    return await ExponentGLObjectManager.destroyObjectAsync(glObject.id);
  }

  /**
   * Same as static [`takeSnapshotAsync()`](#glviewtakesnapshotasyncgl-options),
   * but uses WebGL context that is associated with the view on which the method is called.
   * @param options
   */
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
