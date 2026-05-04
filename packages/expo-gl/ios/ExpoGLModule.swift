// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ExpoGLModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGL")

    AsyncFunction("takeSnapshotAsync") { (contextId: UInt, options: [String: Any], promise: Promise) in
      EXGLObjectManager.shared.takeSnapshot(
        withContextId: contextId as NSNumber,
        andOptions: options,
        resolver: promise.legacyResolver,
        rejecter: promise.legacyRejecter
      )
    }

    AsyncFunction("createContextAsync") { (promise: Promise) in
      guard let runtime = try? appContext?.runtime, let fileSystem = appContext?.fileSystem else {
        promise.reject("E_GL_APP_CONTEXT_NOT_FOUND", "ExpoGL.createContextAsync: Unable to get the app context")
        return
      }
      let glContext = EXGLContext(delegate: nil, fileSystem: fileSystem)

      runtime.schedule(priority: .immediate) {
        runtime.withUnsafePointee { runtimePtr in
          glContext.prepare(withRuntimePointer: runtimePtr, callback: { success in
            if success {
              promise.resolve(["exglCtxId": glContext.contextId])
            } else {
              promise.reject("E_GL_CONTEXT_NOT_INITIALIZED", "ExpoGL.createContextAsync: Unexpected error occurred when initializing headless context")
            }
          }, enableExperimentalWorkletSupport: false)
        }
      }
    }

    AsyncFunction("destroyContextAsync") { (contextId: UInt, promise: Promise) in
      EXGLObjectManager.shared.destroyContext(
        withId: contextId as NSNumber,
        resolve: promise.legacyResolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("destroyObjectAsync") { (objectId: UInt, promise: Promise) in
      EXGLObjectManager.shared.destroyObjectAsync(
        objectId as NSNumber,
        resolve: promise.legacyResolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("createCameraTextureAsync") { (contextId: UInt, cameraViewTag: Int, promise: Promise) in
      guard let cameraView = appContext?.findView(withTag: cameraViewTag, ofType: EXCameraInterface.self) else {
        promise.reject("E_GL_BAD_CAMERA_VIEW_TAG", "ExpoGL.createCameraTextureAsync: Expected a camera view")
        return
      }
      EXGLObjectManager.shared.createTextureForContext(
        withId: contextId as NSNumber,
        cameraView: cameraView,
        resolver: promise.legacyResolver,
        rejecter: promise.legacyRejecter
      )
    }
    .runOnQueue(.main)

    View(GLView.self) {
      Events("onSurfaceCreate")

      Prop("msaaSamples") { (view, msaaSamples: Int) in
        view.msaaSamples = msaaSamples
      }

      Prop("enableExperimentalWorkletSupport") { (view, enableExperimentalWorkletSupport: Bool) in
        view.enableExperimentalWorkletSupport = enableExperimentalWorkletSupport
      }
    }
  }
}
