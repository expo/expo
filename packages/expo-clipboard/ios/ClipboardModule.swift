// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MobileCoreServices

let onClipboardChanged = "onClipboardChanged"

public class ClipboardModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoClipboard")

    // MARK: Strings

    function("getStringAsync") { (options: GetStringOptions) -> String in
      switch options.preferredFormat {
      case .plainText:
        return UIPasteboard.general.string ?? ""
      case .html:
        return UIPasteboard.general.html ?? ""
      }
    }

    function("setStringAsync") { (content: String?, options: SetStringOptions) -> Bool in
      switch options.inputFormat {
      case .plainText:
        UIPasteboard.general.string = content
      case .html:
        UIPasteboard.general.html = content
      }

      return true
    }

    function("hasStringAsync") { () -> Bool in
      UIPasteboard.general.hasStrings || UIPasteboard.general.contains(pasteboardTypes: [kUTTypeHTML as String, kUTTypeRTF as String])
    }

    // MARK: URLs

    function("getUrlAsync") { () -> String? in
      return UIPasteboard.general.url?.absoluteString
    }

    function("setUrlAsync") { (url: URL) in
      UIPasteboard.general.url = url
    }

    function("hasUrlAsync") { () -> Bool in
      return UIPasteboard.general.hasURLs
    }

    // MARK: Images

    function("setImageAsync") { (content: String) in
      guard let data = Data(base64Encoded: content),
            let image = UIImage(data: data) else {
        throw InvalidImageException(content)
      }
      UIPasteboard.general.image = image
    }

    function("hasImageAsync") { () -> Bool in
      return UIPasteboard.general.hasImages
    }

    function("getImageAsync") { (options: GetImageOptions) -> [String: Any]? in
      guard let image = UIPasteboard.general.image else {
        return nil
      }
      guard let data = imageToData(image, options: options) else {
        throw PasteFailureException()
      }

      let imgData = "data:\(options.imageFormat.getMimeType());base64,\(data.base64EncodedString())"
      return [
        "data": imgData,
        // TODO (barthap): Use CGSize when returning Records is possible
        "size": [
          "width": image.size.width,
          "height": image.size.height
        ]
      ]
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

private func imageToData(_ image: UIImage, options: GetImageOptions) -> Data? {
  switch options.imageFormat {
    case .jpeg: return image.jpegData(compressionQuality: options.jpegQuality)
    case .png: return image.pngData()
  }
}
