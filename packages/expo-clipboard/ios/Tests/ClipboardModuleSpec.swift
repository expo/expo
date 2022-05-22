import ExpoModulesTestCore

@testable import ExpoModulesCore
@testable import ExpoClipboard
import UIKit
import MobileCoreServices

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

class ClipboardModuleSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext()
    let holder = ModuleHolder(appContext: appContext, module: ClipboardModule(appContext: appContext))
    /**
     * Base64-encoded PNG data - it's a 1x1 image (a black pixel), 8 bit depth
     * the data has length of 68 bytes after decoding
     */
    let rawPngData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    
    func testModuleFunction<T>(_ functionName: String, args: [Any], _ block: @escaping (T?) -> ()) {
      waitUntil { done in
        holder.call(function: functionName, args: args) { result in
          let value = try! result.get()

//          expect(value).notTo(beNil())
//          expect(value).to(beAKindOf(T.self))
          block(value as? T)
          done()
        }
      }
    }
    
    beforeSuite {
      // replace UIPasteboard.general getter with MockUIPasteboard instance
      let originSelector = #selector(getter:UIPasteboard.general)
      let swizzleSelector = #selector(getter:UIPasteboard.swizzledGeneralPasteboard)
      let originMethod = class_getClassMethod(UIPasteboard.self, originSelector)
      let swizzleMethod = class_getClassMethod(UIPasteboard.self, swizzleSelector)
      method_exchangeImplementations(originMethod!, swizzleMethod!)
    }
    
    // MARK: - Strings
    
    describe("getStringAsync") {
      it("returns plain text from the clipboard") {
        let expectedString = "hello"
        UIPasteboard.general.string = expectedString

//        let options = GetStringOptions(preferredFormat: .plainText)
        let options = [
          "preferredFormat": "plainText"
        ]
        testModuleFunction("getStringAsync", args: [options]) { (result: String?) in
          expect(result) == expectedString
        }
      }
      
      it("returns html from the clipboard") {
        let expectedHtml = "<p>hello</p>"
        UIPasteboard.general.items = [[
          kUTTypeHTML as String: expectedHtml
        ]]

//        let options = GetStringOptions(preferredFormat: .plainText)
        let options = [
          "preferredFormat": "html"
        ]
        testModuleFunction("getStringAsync", args: [options]) { (result: String?) in
          expect(result) == expectedHtml
        }
      }

      it("returns empty string if no text in clipboard") {
        UIPasteboard.general.items = []

//        let options = GetStringOptions(preferredFormat: .plainText)
        let options = [
          "preferredFormat": "plainText"
        ]
        testModuleFunction("getStringAsync", args: [options]) { (result: String?) in
          expect(result) == ""
        }
      }
    }
    
    describe("setStringAsync") {
      it("copies string to clipboard") {
        let expectedString = "hello"
        let options = [
          "inputFormat": "plainText"
        ]
        testModuleFunction("setStringAsync", args: [expectedString, options]) { (result: Bool?) in
          expect(result) == true
          expect(UIPasteboard.general.hasStrings) == true
          expect(UIPasteboard.general.string) == expectedString
        }
      }
      
      it("copies HTML to clipboard") {
        let expectedHtml = "<p>hello</p>"
        let options = [
          "inputFormat": "html"
        ]
        testModuleFunction("setStringAsync", args: [expectedHtml, options]) { (result: Bool?) in
          let mockPasteboard = UIPasteboard.StaticVars.mockPastebaord
          expect(result) == true
          expect(mockPasteboard._items.count) == 3
          expect(mockPasteboard._items[kUTTypeRTF as String]).notTo(beNil())
          expect(mockPasteboard._items[kUTTypeHTML as String] as? String).to(contain("hello"))
          expect(mockPasteboard._items[kUTTypeUTF8PlainText as String] as? String).to(contain("hello"))
        }
      }
    }
    
    describe("hasStringAsync") {
      it("returns true when clipboard contains a string") {
        UIPasteboard.general.string = "hello world"
        
        testModuleFunction("hasStringAsync", args: []) { (result: Bool?) in
          expect(result) == true
        }
      }
      
      it("returns false when there are no no items") {
        UIPasteboard.general.items = []
        
        testModuleFunction("hasStringAsync", args: []) { (result: Bool?) in
          expect(result) == false
        }
      }
      
      it("returns false when items are not strings") {
        UIPasteboard.general.image = UIImage()
        
        testModuleFunction("hasStringAsync", args: []) { (result: Bool?) in
          expect(result) == false
        }
      }
    }
    
    
    
    // MARK: - Images
    
    describe("setImageAsync") {
      it("copies image to clipboard") {

        testModuleFunction("setImageAsync", args: [rawPngData]) { (_: Any?) in
          let pasteboardImgData = UIPasteboard.general.image?.pngData()?.base64EncodedString()
          expect(UIPasteboard.general.hasImages) == true
          expect(pasteboardImgData?.prefix(10)) == rawPngData.prefix(10)
        }
      }
    }
    
    describe("getImageAsync") {
      it("returns PNG image from the clipboard") {
        let expectedImg = UIImage(data: Data(base64Encoded: rawPngData)!)!
        let expectedImgData = expectedImg.pngData()!.base64EncodedString()
        UIPasteboard.general.image = expectedImg

        let options = [
          "format": "png"
        ]
        testModuleFunction("getImageAsync", args: [options]) { (result: [String: Any?]?) in
          let imgData = result!["data"]! as? String?
          let imgSize = result!["size"]! as? [String: Any]
          expect(imgSize!["width"] as? CGFloat) == CGFloat(1)
          expect(imgSize!["height"] as? CGFloat) == CGFloat(1)
          expect(imgData!).to(beginWith("data:image/png;base64,\(expectedImgData)"))
        }
      }
      
      it("returns JPEG image from the clipboard") {
        let expectedImg = UIImage(data: Data(base64Encoded: rawPngData)!)!
        let expectedImgData = expectedImg.jpegData(compressionQuality: 1.0)!.base64EncodedString()
        UIPasteboard.general.image = expectedImg

        let options = [
          "format": "jpeg"
        ]
        testModuleFunction("getImageAsync", args: [options]) { (result: [String: Any?]?) in
          let imgData = result!["data"]! as? String?
          let imgSize = result!["size"]! as? [String: Any]
          expect(imgSize!["width"] as? CGFloat) == CGFloat(1)
          expect(imgSize!["height"] as? CGFloat) == CGFloat(1)
          expect(imgData!).to(beginWith("data:image/jpeg;base64,\(expectedImgData)"))
        }
      }

      it("returns nil if no text in clipboard") {
        UIPasteboard.general.items = []

        let options = [
          "imageFormat": "png"
        ]
        testModuleFunction("getImageAsync", args: [options]) { (result: UIImage?) in
          expect(result).to(beNil())
        }
      }
    }
    
    describe("hasImageAsync") {
      it("returns true when there is image") {
        UIPasteboard.general.image = UIImage()
        
        testModuleFunction("hasImageAsync", args: []) { (result: Bool?) in
          expect(result) == true
        }
      }
      
      it("returns false when there are no no items") {
        UIPasteboard.general.items = []
        
        testModuleFunction("hasImageAsync", args: []) { (result: Bool?) in
          expect(result) == false
        }
      }
      
      it("returns false when items are not images") {
        UIPasteboard.general.items = []
        UIPasteboard.general.string = "not an image"
        
        testModuleFunction("hasImageAsync", args: []) { (result: Bool?) in
          expect(result) == false
        }
      }
    }
    
    // MARK: - URLs
    
    describe("setUrlAsync") {
      it("copies URL to clipboard") {
        let urlString = "https://expo.dev"
        
        testModuleFunction("setUrlAsync", args: [urlString]) { (_: Any?) in
          expect(UIPasteboard.general.hasURLs) == true
          expect(UIPasteboard.general.url?.absoluteString) == urlString
        }
      }
    }
    
    describe("getUrlAsync") {
      it("returns URL from the clipboard") {
        let expectedUrl = URL(string: "http://expo.dev")
        UIPasteboard.general.url = expectedUrl

        testModuleFunction("getUrlAsync", args: []) { (result: String?) in
          expect(result) == expectedUrl?.absoluteString
        }
      }

      it("returns nil if no text in clipboard") {
        UIPasteboard.general.items = []

        testModuleFunction("getUrlAsync", args: []) { (result: String?) in
          expect(result).to(beNil())
        }
      }
    }

    describe("hasUrlAsync") {
      let function = "hasUrlAsync"
      
      it("returns true when there is a URL") {
        UIPasteboard.general.url = URL(string: "https://expo.dev")
        
        testModuleFunction(function, args: []) { (result: Bool?) in
          expect(result) == true
        }
      }
      
      it("returns false when there are no no items") {
        UIPasteboard.general.items = []
        
        testModuleFunction(function, args: []) { (result: Bool?) in
          expect(result) == false
        }
      }
      
      it("returns false when items are not URLs") {
        UIPasteboard.general.items = []
        UIPasteboard.general.string = "not an url"
        
        testModuleFunction(function, args: []) { (result: Bool?) in
          expect(result) == false
        }
      }
    }
  }
}
