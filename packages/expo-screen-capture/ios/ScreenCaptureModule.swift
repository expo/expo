import ExpoModulesCore

let onScreenshotEventName = "onScreenshot"

public final class ScreenCaptureModule: Module {
  private var isBeingObserved = false
  private var isListening = false
  private var blockView: UIView?
  private var protectionTextField: UITextField?
  private var originalParent: CALayer?
  private weak var reparentedWindow: UIWindow?
  private var blurEffectView: AnimatedBlurEffectView?
  private var blurIntensity: CGFloat = 0.5
  private var keyWindow: UIWindow? {
    return SceneGeometry.keyWindow()
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(onScreenshotEventName)

    OnDestroy {
      allowScreenshots()
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
      self.preventScreenshots()

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

  private func preventScreenshots() {
    // Protection is already active. Re-parenting again would nest the window layer
    // inside a second secure canvas and overwrite `originalParent`, making the
    // original layer hierarchy unrecoverable.
    guard protectionTextField == nil else {
      return
    }

    guard let keyWindow = keyWindow else {
      return
    }

    let textField = UITextField()
    textField.isSecureTextEntry = true
    textField.isUserInteractionEnabled = false
    textField.backgroundColor = UIColor.clear
    textField.frame = UIScreen.main.bounds

    guard let originalParentLayer = keyWindow.layer.superlayer else {
      return
    }

    originalParentLayer.addSublayer(textField.layer)

    guard let firstTextFieldSublayer = textField.layer.sublayers?.first else {
      textField.layer.removeFromSuperlayer()
      return
    }

    keyWindow.layer.removeFromSuperlayer()
    firstTextFieldSublayer.addSublayer(keyWindow.layer)
    // Latch the protection state only after the re-parent actually happened, so a
    // failed attempt leaves the module able to retry instead of permanently
    // blocking future calls behind the guard above.
    protectionTextField = textField
    originalParent = originalParentLayer
    reparentedWindow = keyWindow
    setNeedsDisplayRecursively(in: keyWindow)
    DispatchQueue.main.async { [weak self] in
      self?.setNeedsDisplayRecursively(in: keyWindow)
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
      self?.setNeedsDisplayRecursively(in: keyWindow)
    }
  }

  private func allowScreenshots() {
    defer {
      protectionTextField = nil
      originalParent = nil
      reparentedWindow = nil
    }

    guard let textField = protectionTextField,
      let originalParentLayer = originalParent else {
      return
    }

    if let window = reparentedWindow {
      window.layer.removeFromSuperlayer()
      originalParentLayer.addSublayer(window.layer)
      textField.layer.removeFromSuperlayer()
      setNeedsDisplayRecursively(in: window)
      DispatchQueue.main.async { [weak self] in
        self?.setNeedsDisplayRecursively(in: window)
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
        self?.setNeedsDisplayRecursively(in: window)
      }
    } else {
      textField.layer.removeFromSuperlayer()
    }
  }

  private func setNeedsDisplayRecursively(in view: UIView) {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { [weak self] in
        self?.setNeedsDisplayRecursively(in: view)
      }
      return
    }

    // Re-parenting the window layer can drop display work that views relying on
    // `drawRect`-style rendering (for example `react-native-svg` surfaces) had
    // pending, leaving them blank until something else forces a redraw. Re-issue
    // the display work after each re-parent; callers repeat this on the next
    // run-loop turn for same-turn commits and after 0.1 seconds for work issued
    // by the JS layout/props cycle that follows.
    view.setNeedsDisplay()
    view.subviews.forEach { setNeedsDisplayRecursively(in: $0) }
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
