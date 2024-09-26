// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ExpoVideoView: ExpoView {
  private(set) var contentView: EXVideoView

  private let onLoadStart = EventDispatcher()
  private let onLoad = EventDispatcher()
  private let onError = EventDispatcher()
  private let onStatusUpdate = EventDispatcher()
  private let onReadyForDisplay = EventDispatcher()
  private let onFullscreenUpdate = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    guard let legacyModuleRegistry = appContext?.legacyModuleRegistry else {
      fatalError("Unable to get the legacyModuleRegistry from appContext.")
    }
    guard let contentView = EXVideoView(moduleRegistry: legacyModuleRegistry) else {
      fatalError("Unable to create EXVideoView.")
    }
    self.contentView = contentView
    super.init(appContext: appContext)
    self.addSubview(self.contentView)

    contentView.onLoadStart = createEventBinding(onLoadStart)
    contentView.onLoad = createEventBinding(onLoad)
    contentView.onError = createEventBinding(onError)
    contentView.onStatusUpdate = createEventBinding(onStatusUpdate)
    contentView.onReadyForDisplay = createEventBinding(onReadyForDisplay)
    contentView.onFullscreenUpdate = createEventBinding(onFullscreenUpdate)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    self.contentView.frame = bounds
  }

  var status: [AnyHashable: Any] {
    get {
      return contentView.status
    }
    set {
      contentView.status = newValue
    }
  }

  var useNativeControls: Bool {
    get {
      return contentView.useNativeControls
    }
    set {
      contentView.useNativeControls = newValue
    }
  }

  var source: [AnyHashable: Any] {
    get {
      return contentView.source
    }
    set {
      contentView.source = newValue
    }
  }

  var nativeResizeMode: String {
    get {
      return contentView.nativeResizeMode
    }
    set {
      contentView.nativeResizeMode = newValue
    }
  }

  /**
   Create a binding from `EventDispatcher` to `EXDirectEventBlock`.
   */
  private func createEventBinding(_ target: EventDispatcher) -> EXDirectEventBlock {
    return { body in
      if let payload = body as? [String: Any] {
        target(payload)
      }
    }
  }
}
