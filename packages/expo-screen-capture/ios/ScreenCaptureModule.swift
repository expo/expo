import ExpoModulesCore

let onScreenshotEventName = "onScreenshot"
let onScreenRecordingEventName = "onScreenRecording"

public final class ScreenCaptureModule: Module {
  private var isBeingObserved = false
  private var isListening = false
  private var blockView = UIView()

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(onScreenshotEventName, onScreenRecordingEventName)

    OnCreate {
      let boundLength = max(UIScreen.main.bounds.size.width, UIScreen.main.bounds.size.height)
      blockView.frame = CGRect(x: 0, y: 0, width: boundLength, height: boundLength)
      blockView.backgroundColor = .black
    }

    OnStartObserving {
      self.setIsBeing(observed: true)
    }

    OnStopObserving {
      self.setIsBeing(observed: false)
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

  private func setIsBeing(observed: Bool) {
    self.isBeingObserved = observed
    let shouldListen = self.isBeingObserved

    if shouldListen && !isListening {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(self.sendScreenshotEvent),
      name: UIApplication.userDidTakeScreenshotNotification,
      object: nil
    )

    if UIScreen.main.isCaptured {
      self.sendScreenRecordingEvent()
    }

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(self.sendScreenRecordingEvent),
      name: UIScreen.capturedDidChangeNotification,
      object: nil
    )
      isListening = true
    } else if !shouldListen && isListening {
      NotificationCenter.default.removeObserver(self, name: UIApplication.userDidTakeScreenshotNotification, object: nil)
      NotificationCenter.default.removeObserver(self, name: UIScreen.capturedDidChangeNotification, object: nil)
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
  func sendScreenshotEvent() {
    sendEvent(onScreenshotEventName, [
      "body": nil
    ])
  }

  @objc
  func sendScreenRecordingEvent() {
    sendEvent(onScreenRecordingEventName, [
      "isCaptured": UIScreen.main.isCaptured
    ])
  }
}
