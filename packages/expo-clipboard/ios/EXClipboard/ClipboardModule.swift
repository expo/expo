// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

let onClipboardChanged = "onClipboardChanged"

public class ClipboardModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoClipboard")

    function("getStringAsync") { () -> String in
      return UIPasteboard.general.string ?? ""
    }

    function("setString") { (content: String?) in
      UIPasteboard.general.string = content ?? ""
    }

    function("getUrlAsync") { () -> String? in
      return UIPasteboard.general.url?.absoluteString
    }

    function("setUrlAsync") { (content: String, promise: Promise) in
      if let url = URL(string: content) {
        UIPasteboard.general.url = url
        promise.resolve()
      } else {
        promise.reject(InvalidUrlError(url: content))
      }
    }
    
    function("hasUrlAsync") { () -> Bool in
      return UIPasteboard.general.hasURLs
    }

    function("setImageAsync") { (content: String, promise: Promise) in
      if let data = Data(base64Encoded: content), let image = UIImage(data: data) {
        UIPasteboard.general.image = UIImage(data: data)
        promise.resolve()
      } else {
        promise.reject(InvalidImageError(image: content))
      }
    }
    
    function("hasImageAsync") { () -> Bool in
      return UIPasteboard.general.hasImages
    }

    function("getPngImageAsync") { () -> String? in
      let pngPrefix = "data:image/png;base64,"
      if let image = UIPasteboard.general.image, let data = image.pngData() {
        return pngPrefix + data.base64EncodedString()
      } else {
        return nil
      }
    }
      
    function("getJpegImageAsync") { () -> String? in
      let jpgPrefix = "data:image/jpeg;base64,"
      if let image = UIPasteboard.general.image, let data = image.jpegData(compressionQuality: 1.0) {
        return jpgPrefix + data.base64EncodedString()
      } else {
        return nil
      }
    }

    events(onClipboardChanged)

    onStartObserving {
      NotificationCenter.default.removeObserver(self, name: UIPasteboard.changedNotification, object: nil)
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.clipboardChangedListener),
        name: UIPasteboard.changedNotification,
        object: nil
      )
    }

    onStopObserving {
      NotificationCenter.default.removeObserver(self, name: UIPasteboard.changedNotification, object: nil)
    }
  }

  @objc
  func clipboardChangedListener() {
    sendEvent(onClipboardChanged, [
      "content": UIPasteboard.general.string ?? ""
    ])
  }
}

internal struct InvalidImageError: CodedError {
  let image: String
  var description: String {
    return "Invalid base64 image: \(image.prefix(32))\(image.count ?? 0 > 32 ? "..." : "")"
  }
}

internal struct InvalidUrlError: CodedError {
  let url: String
  var description: String {
    "Invalid url: \(url)"
  }
}
