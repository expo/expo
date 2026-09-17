import ExpoModulesCore

let onScreenshotEventName = "onScreenshot"

public final class ScreenCaptureModule: Module {
  private var isBeingObserved = false
  private var isListening = false
  private var recordingOverlay: OverlayWindow?
  private var secureCanvas: SecureWindowCanvas?
  private var privacyOverlay: OverlayWindow?
  private var blurIntensity: CGFloat = 0.5
  private var keyWindow: UIWindow? {
    return SceneGeometry.keyWindow()
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(onScreenshotEventName)

    OnDestroy {
      let canvas = self.secureCanvas
      self.secureCanvas = nil
      DispatchQueue.main.async {
        canvas?.restore()
        self.hideRecordingOverlay()
      }
      disableAppSwitcherProtection()
    }

    OnStartObserving {
      self.setIsBeing(observed: true)
    }

    OnStopObserving {
      self.setIsBeing(observed: false)
    }

    AsyncFunction("preventScreenCapture") {
      self.preventScreenRecording()
      try self.preventScreenshots()

      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.preventScreenRecording),
        name: UIScreen.capturedDidChangeNotification,
        object: nil
      )
    }.runOnQueue(.main)

    AsyncFunction("allowScreenCapture") {
      self.allowScreenshots()
      self.hideRecordingOverlay()

      NotificationCenter.default.removeObserver(
        self,
        name: UIScreen.capturedDidChangeNotification,
        object: nil
      )
    }.runOnQueue(.main)

    AsyncFunction("enableAppSwitcherProtection") { (blurIntensity: CGFloat) in
      self.blurIntensity = blurIntensity
      enableAppSwitcherProtection()
    }.runOnQueue(.main)

    AsyncFunction("disableAppSwitcherProtection") {
      disableAppSwitcherProtection()
    }.runOnQueue(.main)
  }

  private func setIsBeing(observed: Bool) {
    self.isBeingObserved = observed
    let shouldListen = self.isBeingObserved

    if shouldListen && !isListening {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.listenForScreenCapture),
        name: UIApplication.userDidTakeScreenshotNotification,
        object: nil
      )
      isListening = true
    } else if !shouldListen && isListening {
      NotificationCenter.default.removeObserver(
        self,
        name: UIApplication.userDidTakeScreenshotNotification,
        object: nil
      )
      isListening = false
    }
  }

  @objc
  func preventScreenRecording() {
    guard let keyWindow else { return }
    hideRecordingOverlay()
    if UIScreen.main.isCaptured {
      let overlay = OverlayWindow(above: keyWindow)
      overlay.contentView.backgroundColor = .black
      recordingOverlay = overlay
    }
  }

  @objc
  func listenForScreenCapture() {
    sendEvent(onScreenshotEventName, [
      "body": nil
    ])
  }

  private func hideRecordingOverlay() {
    recordingOverlay?.dismiss()
    recordingOverlay = nil
  }

  private func preventScreenshots() throws {
    if let canvas = secureCanvas, let protected = canvas.window, protected === keyWindow {
      return
    }

    guard let keyWindow else {
      throw NoKeyWindowException()
    }

    // The protected window changed or died; move protection to the current key window.
    // Attach the new canvas before releasing the old one so a failed attach keeps
    // the existing protection in place.
    guard let canvas = SecureWindowCanvas(protecting: keyWindow) else {
      throw SecureCanvasAttachmentException()
    }
    secureCanvas?.restore()
    secureCanvas = canvas
  }

  private func allowScreenshots() {
    secureCanvas?.restore()
    secureCanvas = nil
  }

  private func enableAppSwitcherProtection() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(appWillResignActive),
      name: UIApplication.willResignActiveNotification,
      object: nil
    )

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(appDidBecomeActive),
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )
  }

  private func disableAppSwitcherProtection() {
    NotificationCenter.default.removeObserver(
      self,
      name: UIApplication.willResignActiveNotification,
      object: nil
    )

    NotificationCenter.default.removeObserver(
      self,
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )

    removePrivacyOverlay()
  }

  @objc
  private func appWillResignActive() {
    showPrivacyOverlay()
  }

  @objc
  private func appDidBecomeActive() {
    removePrivacyOverlay()
  }

  private func showPrivacyOverlay() {
    guard privacyOverlay == nil, let keyWindow else {
      return
    }
    let overlay = OverlayWindow(above: keyWindow)
    let blurEffectView = AnimatedBlurEffectView(style: .light, intensity: blurIntensity)
    blurEffectView.frame = overlay.contentView.bounds
    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    overlay.contentView.addSubview(blurEffectView)
    overlay.contentView.alpha = 0
    privacyOverlay = overlay

    blurEffectView.setupBlur()

    UIView.animate(withDuration: 0.3, delay: 0, options: [.curveEaseOut]) {
      overlay.contentView.alpha = 1
    }
  }

  private func removePrivacyOverlay() {
    guard let overlay = privacyOverlay else {
      return
    }
    UIView.animate(
      withDuration: 0.25,
      delay: 0,
      options: [.curveEaseIn],
      animations: {
        overlay.contentView.alpha = 0
      },
      completion: { _ in
        overlay.dismiss()
        self.privacyOverlay = nil
      }
    )
  }
}

internal final class NoKeyWindowException: Exception {
  override var reason: String {
    "Screenshots cannot be prevented because the app has no key window yet. Retry after the app's first window is visible, for example after the first render"
  }
}

internal final class SecureCanvasAttachmentException: Exception {
  override var reason: String {
    "Screenshots cannot be prevented because the window is not attached to the screen yet, so the secure canvas could not be installed. Screenshots remain possible. Retry after the window is fully presented"
  }
}
