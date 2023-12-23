import ExpoModulesCore

let onScreenshotEventName = "onScreenshot"

public final class ScreenCaptureModule: Module {
  private var _isBeingObserved = false
  private var _isListening = false
  private var _blockView = UIView()

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenCapture")
    
    Events(onScreenshotEventName)
    
    OnCreate {
      let boundLength = max(UIScreen.main.bounds.size.width, UIScreen.main.bounds.size.height)
      _blockView.frame = CGRect(x: 0, y: 0, width: boundLength, height: boundLength)
      _blockView.backgroundColor = UIColor.black
      
    }
    
    OnStartObserving {
      self.setIsBeingObserved(isBeingObserved: true)
    }
    
    OnStopObserving {
      self.setIsBeingObserved(isBeingObserved: false)
    }

    AsyncFunction("preventScreenCapture") {
      // If already recording, block it
      self.preventScreenRecording()
      
      NotificationCenter.default.addObserver(self, selector: #selector(self.preventScreenRecording), name: UIScreen.capturedDidChangeNotification, object: nil)
    }.runOnQueue(.main)
    
    AsyncFunction("allowScreenCapture") {
      NotificationCenter.default.removeObserver(self, name: UIScreen.capturedDidChangeNotification, object: nil)
    }
  }
  
  func setIsBeingObserved(isBeingObserved: Bool) {
    _isBeingObserved = isBeingObserved
    let shouldListen = _isBeingObserved
    
    if (shouldListen && !_isListening) {
      NotificationCenter.default.addObserver(self, selector: #selector(self.listenForScreenCapture), name: UIApplication.userDidTakeScreenshotNotification, object: nil)
      _isListening = true
    } else if (!shouldListen && _isListening) {
      NotificationCenter.default.removeObserver(self, name: UIApplication.userDidTakeScreenshotNotification, object: nil)
      _isListening = false
    }
  }
  
  @objc
  func preventScreenRecording() {
    let isCaptured = UIScreen.main.isCaptured
  
    if (isCaptured) {
      UIApplication.shared.keyWindow?.subviews.first?.addSubview(_blockView)
    } else {
      _blockView.removeFromSuperview()
    }
  }
  
  @objc func listenForScreenCapture() {
    sendEvent(onScreenshotEventName, [
      "body": nil
    ])
  }
}

