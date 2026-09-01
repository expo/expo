import ExpoModulesCore

let onScreenshotEventName = "onScreenshot"

public final class ScreenCaptureModule: Module {
  private var isBeingObserved = false
  private var isListening = false
  private var blockView: UIView?
  private var secureCanvas: SecureWindowCanvas?
  private var blurEffectView: AnimatedBlurEffectView?
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
      self.blockView?.removeFromSuperview()

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
    guard let keyWindow = keyWindow,
      let visibleView = keyWindow.subviews.first else { return }
    let blockView = getOrCreateBlockView()

    let isCaptured = UIScreen.main.isCaptured
    if isCaptured {
      visibleView.addSubview(blockView)
    } else {
      blockView.removeFromSuperview()
    }
  }

  @objc
  func listenForScreenCapture() {
    sendEvent(onScreenshotEventName, [
      "body": nil
    ])
  }

  private func getOrCreateBlockView() -> UIView {
    guard let blockView else {
      let view = UIView()
      let boundLength = max(UIScreen.main.bounds.size.width, UIScreen.main.bounds.size.height)
      view.frame = CGRect(x: 0, y: 0, width: boundLength, height: boundLength)
      view.backgroundColor = .black

      self.blockView = view
      return view
    }
    return blockView
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
    // Don't add a new blur view if one already exists
    guard self.blurEffectView == nil,
      let keyWindow = keyWindow,
      let rootView = keyWindow.subviews.first else {
      return
    }

    let blurEffectView = AnimatedBlurEffectView(style: .light, intensity: self.blurIntensity)
    blurEffectView.frame = rootView.bounds
    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    blurEffectView.alpha = 0

    rootView.addSubview(blurEffectView)
    self.blurEffectView = blurEffectView

    blurEffectView.setupBlur()

    UIView.animate(
      withDuration: 0.3,
      delay: 0,
      options: [.curveEaseOut],
      animations: {
        blurEffectView.alpha = 1.0
      }
    )
  }

  private func removePrivacyOverlay() {
    guard let blurEffectView = self.blurEffectView else {
      return
    }
    UIView.animate(
      withDuration: 0.25,
      delay: 0,
      options: [.curveEaseIn],
      animations: {
        blurEffectView.alpha = 0
      },
      completion: { _ in
        blurEffectView.removeFromSuperview()
        self.blurEffectView = nil
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
