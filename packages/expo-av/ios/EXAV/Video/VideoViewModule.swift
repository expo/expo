// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
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

    View(EXVideoView.self) {
      Events(
        "onStatusUpdate",
        "onLoadStart",
        "onLoad",
        "onError",
        "onReadyForDisplay",
        "onFullscreenUpdate"
      )

      Prop("status") { (view: EXVideoView, status: [String: Any]) in
        view.status = status
      }

      Prop("useNativeControls") { (view: EXVideoView, useNativeControls: Bool) in
        view.useNativeControls = useNativeControls
      }

      Prop("source") { (view: EXVideoView, source: [String: Any]) in
        view.source = source
      }

      Prop("resizeMode") { (view: EXVideoView, resizeMode: String) in
        view.nativeResizeMode = resizeMode
      }
    }
  }

  private func runBlockForView(_ tag: Int, _ block: @escaping (EXVideoView) -> Void) {
    let uiManager: EXUIManager? = appContext?.legacyModule(implementing: EXUIManager.self)

    uiManager?.executeUIBlock({ (view: Any) in
      if let view = view as? EXVideoView {
        block(view)
      }
    }, forView: tag, of: EXVideoView.self)
  }
}
