// Copyright 2025-present 650 Industries. All rights reserved.

// import ContactsUI
import SwiftUI
import ExpoModulesCore
import AVKit

private let DEFAULT_PRIORITIZE_VIDEO_DEVICES = true

public final class VideoAirPlayButtonView: ExpoView {
  let routePickerView = AVRoutePickerView()
  let onBeginPresentingRoutes = EventDispatcher("onBeginPresentingRoutes")
  let onEndPresentingRoutes = EventDispatcher("onEndPresentingRoutes")

  lazy var delegate = {
    ExpoRoutePickerButtonDelegate(
      onWillStartPresentingRoutes: { [weak self] in
        self?.onBeginPresentingRoutes()
      },
      onDidEndPresentingRoutes: { [weak self] in
        self?.onEndPresentingRoutes()
      }
    )
  }()

  var activeTintColor: UIColor? {
    didSet {
      routePickerView.activeTintColor = activeTintColor
    }
  }

  var tint: UIColor? {
    didSet {
      routePickerView.tintColor = tint
    }
  }

  var prioritizeVideoDevices = DEFAULT_PRIORITIZE_VIDEO_DEVICES {
    didSet {
      routePickerView.prioritizesVideoDevices = prioritizeVideoDevices
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    routePickerView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    routePickerView.delegate = delegate
    routePickerView.prioritizesVideoDevices = DEFAULT_PRIORITIZE_VIDEO_DEVICES

    addSubview(routePickerView)
  }
}

internal class ExpoRoutePickerButtonDelegate: NSObject, AVRoutePickerViewDelegate {
  let onWillStartPresentingRoutes: (() -> Void)?
  let onDidEndPresentingRoutes: (() -> Void)?

  init(onWillStartPresentingRoutes: (() -> Void)?, onDidEndPresentingRoutes: (() -> Void)?) {
    self.onWillStartPresentingRoutes = onWillStartPresentingRoutes
    self.onDidEndPresentingRoutes = onDidEndPresentingRoutes
  }

  func routePickerViewWillBeginPresentingRoutes(_ routePickerView: AVRoutePickerView) {
    onWillStartPresentingRoutes?()
  }

  func routePickerViewDidEndPresentingRoutes(_ routePickerView: AVRoutePickerView) {
    onDidEndPresentingRoutes?()
  }
}
