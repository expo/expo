// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import AVFoundation

public final class VideoViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideoView")

    Constant("ScaleNone") { AVLayerVideoGravity.resizeAspect.rawValue }
    Constant("ScaleToFill") { AVLayerVideoGravity.resize.rawValue }
    Constant("ScaleAspectFit") { AVLayerVideoGravity.resizeAspect.rawValue }
    Constant("ScaleAspectFill") { AVLayerVideoGravity.resizeAspectFill.rawValue }

    AsyncFunction("setFullscreen") { (viewTag: Int, value: Bool, promise: Promise) in
      self.runBlockForView(viewTag) { view in
        view.contentView.setFullscreen(value, resolver: promise.resolver, rejecter: promise.legacyRejecter)
      }
    }

    View(ExpoVideoView.self) {
      Events(
        "onStatusUpdate",
        "onLoadStart",
        "onLoad",
        "onError",
        "onReadyForDisplay",
        "onFullscreenUpdate"
      )

      Prop("status") { (view: ExpoVideoView, status: [String: Any]) in
        view.status = status
      }

      Prop("useNativeControls") { (view: ExpoVideoView, useNativeControls: Bool) in
        view.useNativeControls = useNativeControls
      }

      Prop("source") { (view: ExpoVideoView, source: [String: Any]) in
        view.source = source
      }

      Prop("resizeMode") { (view: ExpoVideoView, resizeMode: String) in
        view.nativeResizeMode = resizeMode
      }
    }
  }

  private func runBlockForView(_ tag: Int, _ block: @escaping (ExpoVideoView) -> Void) {
    let uiManager: EXUIManager? = appContext?.legacyModule(implementing: EXUIManager.self)

    uiManager?.executeUIBlock({ (view: Any) in
      if let view = view as? ExpoVideoView {
        block(view)
      }
    },
    forView: tag,
    of: ExpoVideoView.self)
  }
}
