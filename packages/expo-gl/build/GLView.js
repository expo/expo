import { NativeModulesProxy, UnavailabilityError, requireNativeViewManager, CodedError, } from 'expo-modules-core';
import * as React from 'react';
import { Platform, View, findNodeHandle } from 'react-native';
import { configureLogging } from './GLUtils';
import { createWorkletContextProvider } from './GLWorkletContextProvider';
const { ExponentGLObjectManager, ExponentGLViewManager } = NativeModulesProxy;
const NativeView = requireNativeViewManager('ExponentGLView');
/**
 * A component that acts as an OpenGL render target
 */
export class GLView extends React.Component {
    static NativeView;
    static defaultProps = {
        msaaSamples: 4,
    };
    static async createContextAsync() {
        const { exglCtxId } = await ExponentGLObjectManager.createContextAsync();
        return getGl(exglCtxId);
    }
    static async destroyContextAsync(exgl) {
        const exglCtxId = getContextId(exgl);
        return ExponentGLObjectManager.destroyContextAsync(exglCtxId);
    }
    static async takeSnapshotAsync(exgl, options = {}) {
        const exglCtxId = getContextId(exgl);
        return ExponentGLObjectManager.takeSnapshotAsync(exglCtxId, options);
    }
    static getWorkletContext = createWorkletContextProvider();
    nativeRef = null;
    exglCtxId;
    render() {
        const { onContextCreate, // eslint-disable-line no-unused-vars
        msaaSamples, ...viewProps } = this.props;
        return (React.createElement(View, { ...viewProps },
            React.createElement(NativeView, { ref: this._setNativeRef, style: {
                    flex: 1,
                    ...(Platform.OS === 'ios'
                        ? {
                            backgroundColor: 'transparent',
                        }
                        : {}),
                }, onSurfaceCreate: this._onSurfaceCreate, msaaSamples: Platform.OS === 'ios' ? msaaSamples : undefined })));
    }
    _setNativeRef = (nativeRef) => {
        if (this.props.nativeRef_EXPERIMENTAL) {
            this.props.nativeRef_EXPERIMENTAL(nativeRef);
        }
        this.nativeRef = nativeRef;
    };
    _onSurfaceCreate = ({ nativeEvent: { exglCtxId } }) => {
        const gl = getGl(exglCtxId);
        this.exglCtxId = exglCtxId;
        if (this.props.onContextCreate) {
            this.props.onContextCreate(gl);
        }
    };
    async startARSessionAsync() {
        if (!ExponentGLViewManager.startARSessionAsync) {
            throw new UnavailabilityError('expo-gl', 'startARSessionAsync');
        }
        return await ExponentGLViewManager.startARSessionAsync(findNodeHandle(this.nativeRef));
    }
    async createCameraTextureAsync(cameraRefOrHandle) {
        if (!ExponentGLObjectManager.createCameraTextureAsync) {
            throw new UnavailabilityError('expo-gl', 'createCameraTextureAsync');
        }
        const { exglCtxId } = this;
        if (!exglCtxId) {
            throw new Error("GLView's surface is not created yet!");
        }
        const cameraTag = findNodeHandle(cameraRefOrHandle);
        const { exglObjId } = await ExponentGLObjectManager.createCameraTextureAsync(exglCtxId, cameraTag);
        return { id: exglObjId };
    }
    async destroyObjectAsync(glObject) {
        if (!ExponentGLObjectManager.destroyObjectAsync) {
            throw new UnavailabilityError('expo-gl', 'destroyObjectAsync');
        }
        return await ExponentGLObjectManager.destroyObjectAsync(glObject.id);
    }
    async takeSnapshotAsync(options = {}) {
        if (!GLView.takeSnapshotAsync) {
            throw new UnavailabilityError('expo-gl', 'takeSnapshotAsync');
        }
        const { exglCtxId } = this;
        return await GLView.takeSnapshotAsync(exglCtxId, options);
    }
}
GLView.NativeView = NativeView;
// Get the GL interface from an EXGLContextId
const getGl = (exglCtxId) => {
    if (!global.__EXGLContexts) {
        throw new CodedError('ERR_GL_NOT_AVAILABLE', 'GL is currently not available. (Have you enabled remote debugging? GL is not available while debugging remotely.)');
    }
    const gl = global.__EXGLContexts[String(exglCtxId)];
    configureLogging(gl);
    return gl;
};
const getContextId = (exgl) => {
    const exglCtxId = exgl && typeof exgl === 'object' ? exgl.contextId : exgl;
    if (!exglCtxId || typeof exglCtxId !== 'number') {
        throw new Error(`Invalid EXGLContext id: ${String(exglCtxId)}`);
    }
    return exglCtxId;
};
//# sourceMappingURL=GLView.js.map