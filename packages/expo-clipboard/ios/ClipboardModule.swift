// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

let onClipboardChanged = "onClipboardChanged"

public class ClipboardModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoClipboard")
    
    // MARK: Strings
    
    function("getStringAsync") { () -> String in
      return UIPasteboard.general.string ?? ""
    }
    
    function("setStringAsync") { (content: String?) in
      UIPasteboard.general.string = content ?? ""
      return true
    }
    
    // MARK: URLs
    
    function("getUrlAsync") { () -> String? in
      return UIPasteboard.general.url?.absoluteString
    }
    
    function("setUrlAsync") { (content: String) in
      guard let url = URL(string: content) else {
        throw InvalidUrlException(url: content)
      }
      UIPasteboard.general.url = url
    }
    
    function("hasUrlAsync") { () -> Bool in
      return UIPasteboard.general.hasURLs
    }
    
    // MARK: Images
    
    function("setImageAsync") { (content: String) in
      guard let data = Data(base64Encoded: content), let image = UIImage(data: data) else {
        throw InvalidImageException(image: content)
      }
      UIPasteboard.general.image = image
    }
    
    function("hasImageAsync") { () -> Bool in
      return UIPasteboard.general.hasImages
    }
    
    function("getPngImageAsync") { () -> String? in
      guard let data = UIPasteboard.general.image?.pngData() else {
        return nil
      }
      let pngPrefix = "data:image/png;base64,"
      return pngPrefix + data.base64EncodedString()
    }
    
    function("getJpegImageAsync") { () -> String? in
      guard let data = UIPasteboard.general.image?.jpegData(compressionQuality: 1.0) else {
        return nil
      }
      let jpgPrefix = "data:image/jpeg;base64,"
      return jpgPrefix + data.base64EncodedString()
    }
    
    // MARK: Events
    
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
