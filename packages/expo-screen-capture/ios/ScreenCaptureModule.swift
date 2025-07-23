import ExpoModulesCore

let onScreenshotEventName = "onScreenshot"

public final class ScreenCaptureModule: Module {
  private var isBeingObserved = false
  private var isListening = false
  private var blockView = UIView()
  private var protectionTextField: UITextField?
  private var originalParent: CALayer?
  private var blurEffectView: AnimatedBlurEffectView?
  private var blurIntensity: CGFloat = 0.5
  private var keyWindow: UIWindow? {
    return UIApplication.shared.connectedScenes
      .flatMap { ($0 as? UIWindowScene)?.windows ?? [] }
      .last { $0.isKeyWindow }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(onScreenshotEventName)

    OnCreate {
      let boundLength = max(UIScreen.main.bounds.size.width, UIScreen.main.bounds.size.height)
      blockView.frame = CGRect(x: 0, y: 0, width: boundLength, height: boundLength)
      blockView.backgroundColor = .black
    }

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

  private func preventScreenshots() {
    guard let keyWindow = keyWindow,
      let visibleView = keyWindow.subviews.first else { return }

    let textField = UITextField()
    textField.isSecureTextEntry = true
    textField.isUserInteractionEnabled = false
    textField.backgroundColor = UIColor.black

    originalParent = visibleView.layer.superlayer

    if let viewSuperlayer = visibleView.layer.superlayer {
      viewSuperlayer.addSublayer(textField.layer)

      if let firstTextFieldSublayer = textField.layer.sublayers?.first {
        visibleView.layer.removeFromSuperlayer()
        visibleView.layer.position = CGPoint(x: visibleView.bounds.width / 2, y: visibleView.bounds.height / 2)
        firstTextFieldSublayer.addSublayer(visibleView.layer)
      }
    }

    protectionTextField = textField
  }

  private func allowScreenshots() {
    guard let textField = protectionTextField else {
      return
    }

    if let protectedLayer = textField.layer.sublayers?.first?.sublayers?.first {
      protectedLayer.removeFromSuperlayer()
      if let parent = originalParent {
        parent.addSublayer(protectedLayer)
      }
    }

    textField.layer.removeFromSuperlayer()

    protectionTextField = nil
    originalParent = nil
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
    if let keyWindow = keyWindow,
      let rootView = keyWindow.subviews.first {
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
