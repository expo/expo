// Copyright 2022-present 650 Industries. All rights reserved.

import ABI49_0_0ExpoModulesCore
import AVFoundation

public final class VideoViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideoView")

    Constants([
      "ScaleNone": AVLayerVideoGravity.resizeAspect,
      "ScaleToFill": AVLayerVideoGravity.resize,
      "ScaleAspectFit": AVLayerVideoGravity.resizeAspect,
      "ScaleAspectFill": AVLayerVideoGravity.resizeAspectFill
    ])

    AsyncFunction("setFullscreen") { (viewTag: Int, value: Bool, promise: Promise) in
      self.runBlockForView(viewTag) { view in
        view.setFullscreen(value, resolver: promise.resolver, rejecter: promise.legacyRejecter)
      }
    }

    View(ABI49_0_0EXVideoView.self) {
      Events(
        "onStatusUpdate",
        "onLoadStart",
        "onLoad",
        "onError",
        "onReadyForDisplay",
        "onFullscreenUpdate"
      )

      Prop("status") { (view: ABI49_0_0EXVideoView, status: [String: Any]) in
        view.status = status
      }

      Prop("useNativeControls") { (view: ABI49_0_0EXVideoView, useNativeControls: Bool) in
        view.useNativeControls = useNativeControls
      }

      Prop("source") { (view: ABI49_0_0EXVideoView, source: [String: Any]) in
        view.source = source
      }

      Prop("resizeMode") { (view: ABI49_0_0EXVideoView, resizeMode: String) in
        view.nativeResizeMode = resizeMode
      }
    }
  }

  private func runBlockForView(_ tag: Int, _ block: @escaping (ABI49_0_0EXVideoView) -> Void) {
    let uiManager: ABI49_0_0EXUIManager? = appContext?.legacyModule(implementing: ABI49_0_0EXUIManager.self)

    uiManager?.executeUIBlock({ (view: Any) in
      if let view = view as? ABI49_0_0EXVideoView {
        block(view)
      }
    }, forView: tag, of: ABI49_0_0EXVideoView.self)
  }
}
