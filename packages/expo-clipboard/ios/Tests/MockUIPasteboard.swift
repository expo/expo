import UIKit

class MockUIPasteboard: UIPasteboard {
  var _items: [String : Any] = [:]
  
  override var items: [[String : Any]]
  {
    get { return [_items] }
    set(newItems) { _items = newItems.count > 0 ? newItems[0] : [:] }
  }
  
  override var string: String?
  {
    get { return _items["string"] as? String }
    set(newString) { _items = ["string": newString as Any ] }
  }
  
  override var url: URL?
  {
    get { return _items["url"] as? URL }
    set(newUrl) { _items = ["url": newUrl as Any ] }
  }
  
  override var image: UIImage?
  {
    get { return _items["image"] as? UIImage }
    set(newImg) { _items = ["image": newImg as Any ] }
  }
  
  override var hasStrings: Bool
  { get { return _items["string"] != nil } }
  
  override var hasImages: Bool
  { get { return _items["image"] != nil } }
  
  override var hasURLs: Bool
  { get { return _items["url"] != nil } }
  
  override func value(forPasteboardType pasteboardType: String) -> Any? {
    return _items[pasteboardType]
  }
  
  override func data(forPasteboardType pasteboardType: String) -> Data? {
    return _items[pasteboardType] as? Data
  }
  
  override func setItems(_ items: [[String : Any]], options: [UIPasteboard.OptionsKey : Any] = [:]) {
    self.items = items
  }
  
  override func contains(pasteboardTypes: [String]) -> Bool {
    return _items.contains(where: { (key, _) in
      pasteboardTypes.contains(key)
    })
  }
}

extension UIPasteboard {
  struct StaticVars {
    static var mockPastebaord = MockUIPasteboard()
  }
  
  @objc dynamic class var swizzledGeneralPasteboard: UIPasteboard
  { get { return StaticVars.mockPastebaord } }
}
