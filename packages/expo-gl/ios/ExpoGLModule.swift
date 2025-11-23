// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ExpoGLModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGL")

    AsyncFunction("takeSnapshotAsync") { (contextId: UInt, options: [String: Any], promise: Promise) in
      EXGLObjectManager.shared.takeSnapshot(
        withContextId: contextId as NSNumber,
        andOptions: options,
        resolver: promise.resolver,
        rejecter: promise.legacyRejecter
      )
    }

    AsyncFunction("createContextAsync") { (promise: Promise) in
      guard let legacyModuleRegistry = appContext?.legacyModuleRegistry else {
        promise.reject("E_GL_MODULE_REGISTRY_NOT_FOUND", "ExpoGL.createContextAsync: Unable to find the module registry")
        return
      }
      let glContext = EXGLContext(delegate: nil, andModuleRegistry: legacyModuleRegistry)

      glContext.prepare({ success in
        if success {
          promise.resolve(["exglCtxId": glContext.contextId as NSNumber])
        } else {
          promise.reject("E_GL_CONTEXT_NOT_INITIALIZED", "ExpoGL.createContextAsync: Unexpected error occurred when initializing headless context")
        }
      }, andEnableExperimentalWorkletSupport: false)
    }

    AsyncFunction("destroyContextAsync") { (contextId: UInt, promise: Promise) in
      EXGLObjectManager.shared.destroyContext(
        withId: contextId as NSNumber,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("destroyObjectAsync") { (objectId: UInt, promise: Promise) in
      EXGLObjectManager.shared.destroyObjectAsync(
        objectId as NSNumber,
        resolve: promise.resolver,
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
        resolver: promise.resolver,
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
