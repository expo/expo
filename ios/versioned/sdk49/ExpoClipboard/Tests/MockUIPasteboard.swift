import UIKit

class MockUIPasteboard: UIPasteboard {
  var _items: [String: Any] = [:]

  override var items: [[String: Any]] {
    get {
      return [_items]
    }
    set {
      _items = newValue.count > 0 ? newValue[0] : [:]
    }
  }

  override var string: String? {
    get {
      return _items["string"] as? String
    }
    set {
      _items = ["string": newValue as Any]
    }
  }

  override var url: URL? {
    get {
      return _items["url"] as? URL
    }
    set {
      _items = ["url": newValue as Any]
    }
  }

  override var image: UIImage? {
    get {
      return _items["image"] as? UIImage
    }
    set {
      _items = ["image": newValue as Any]
    }
  }

  override var hasStrings: Bool {
    return _items["string"] != nil
  }

  override var hasImages: Bool {
    return _items["image"] != nil
  }

  override var hasURLs: Bool {
    return _items["url"] != nil
  }

  override func value(forPasteboardType pasteboardType: String) -> Any? {
    return _items[pasteboardType]
  }

  override func data(forPasteboardType pasteboardType: String) -> Data? {
    return _items[pasteboardType] as? Data
  }

  override func setItems(_ items: [[String: Any]], options: [UIPasteboard.OptionsKey: Any] = [:]) {
    self.items = items
  }

  override func contains(pasteboardTypes: [String]) -> Bool {
    return _items.contains(where: { key, _ in
      pasteboardTypes.contains(key)
    })
  }
}

extension UIPasteboard {
  struct StaticVars {
    static var mockPastebaord = MockUIPasteboard()
  }

  @objc dynamic class var swizzledGeneralPasteboard: UIPasteboard {
    return StaticVars.mockPastebaord
  }
}

func swizzleGeneralPasteboard() {
  // replace UIPasteboard.general getter with MockUIPasteboard instance
  let originSelector = #selector(getter:UIPasteboard.general)
  let swizzleSelector = #selector(getter:UIPasteboard.swizzledGeneralPasteboard)
  let originMethod = class_getClassMethod(UIPasteboard.self, originSelector)
  let swizzleMethod = class_getClassMethod(UIPasteboard.self, swizzleSelector)
  method_exchangeImplementations(originMethod!, swizzleMethod!)
}
