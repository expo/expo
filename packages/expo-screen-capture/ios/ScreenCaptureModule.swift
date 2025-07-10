import ExpoModulesCore

let onScreenshotEventName = "onScreenshot"

public final class ScreenCaptureModule: Module {
  private var isBeingObserved = false
  private var isListening = false
  private var blockView = UIView()
  private var protectionTextField: UITextField?
  private var originalParent: CALayer?

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
    let isCaptured = UIScreen.main.isCaptured

    if isCaptured {
      UIApplication.shared.keyWindow?.subviews.first?.addSubview(blockView)
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
    guard let keyWindow = UIApplication.shared.keyWindow,
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
}
