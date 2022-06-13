import ExpoModulesTestCore

@testable import ExpoModulesCore
@testable import ExpoClipboard
import UIKit
import MobileCoreServices

class ClipboardModuleSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext()
    let holder = ModuleHolder(appContext: appContext, module: ClipboardModule(appContext: appContext))

    func testModuleFunction<T>(_ functionName: String, args: [Any], _ block: @escaping (T?) -> Void) {
      waitUntil { done in
        holder.call(function: functionName, args: args) { result in
          let value = try! result.get()
          expect(value).to(beAKindOf(T?.self))
          block(value as? T)
          done()
        }
      }
    }

    func expectModuleFunctionThrows<T>(_ functionName: String, args: [Any], exception: T.Type) where T: Exception {
      waitUntil { done in
        holder.call(function: functionName, args: args) { result in
          expect(result).to(beFailure(exception: exception))
          done()
        }
      }
    }

    beforeSuite {
      swizzleGeneralPasteboard()
    }

    // MARK: - Strings

    describe("getStringAsync") {
      let function = "getStringAsync"

      it("returns plain text from the clipboard") {
        let expectedString = "hello"
        UIPasteboard.general.string = expectedString

        // let options = GetStringOptions(preferredFormat: .plainText)
        let options = [
          "preferredFormat": "plainText"
        ]
        testModuleFunction(function, args: [options]) { (result: String?) in
          expect(result) == expectedString
        }
      }

      it("returns html from the clipboard") {
        let expectedHtml = "<p>hello</p>"
        UIPasteboard.general.items = [[
          kUTTypeHTML as String: expectedHtml
        ]]

        // let options = GetStringOptions(preferredFormat: .html)
        let options = [
          "preferredFormat": "html"
        ]
        testModuleFunction(function, args: [options]) { (result: String?) in
          expect(result) == expectedHtml
        }
      }

      it("returns empty string if no text in clipboard") {
        UIPasteboard.general.items = []

        let options = [
          "preferredFormat": "plainText"
        ]
        testModuleFunction(function, args: [options]) { (result: String?) in
          expect(result) == ""
        }
      }
    }

    describe("setStringAsync") {
      let function = "setStringAsync"

      it("copies string to clipboard") {
        let expectedString = "hello"
        let options = [
          "inputFormat": "plainText"
        ]
        testModuleFunction(function, args: [expectedString, options]) { (result: Bool?) in
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
        testModuleFunction(function, args: [expectedHtml, options]) { (result: Bool?) in
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
      let function = "hasStringAsync"

      it("returns true when clipboard contains a string") {
        UIPasteboard.general.string = "hello world"

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

      it("returns false when items are not strings") {
        UIPasteboard.general.image = UIImage()

        testModuleFunction(function, args: []) { (result: Bool?) in
          expect(result) == false
        }
      }
    }

    // MARK: - Images

    /**
     * Base64-encoded PNG data - it's a 1x1 image (a black pixel), 8 bit depth
     * the data has length of 68 bytes after decoding
     */
    let testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    let testImage = UIImage(data: Data(base64Encoded: testImageBase64)!)!

    describe("setImageAsync") {
      it("copies image to clipboard") {
        testModuleFunction("setImageAsync", args: [testImageBase64]) { (_: Any?) in
          let pasteboardImgData = UIPasteboard.general.image?.pngData()?.base64EncodedString()
          expect(UIPasteboard.general.hasImages) == true
          // compare first 10 characters only as UIImage can optimize the data so it differs
          expect(pasteboardImgData?.prefix(10)) == testImageBase64.prefix(10)
        }
      }

      it("throws when given invalid base64") {
        let base64 = "invalid"
        expectModuleFunctionThrows("setImageAsync", args: [base64], exception: InvalidImageException.self)
      }
    }

    describe("getImageAsync") {
      let function = "getImageAsync"

      it("returns PNG image from the clipboard") {
        let expectedImgData = testImage.pngData()!.base64EncodedString()
        UIPasteboard.general.image = testImage

        let options = [
          "format": "png"
        ]
        testModuleFunction(function, args: [options]) { (result: [String: Any?]?) in
          let imgData = result!["data"]! as? String?
          let imgSize = result!["size"]! as? [String: Any]
          expect(imgSize!["width"] as? CGFloat) == CGFloat(1)
          expect(imgSize!["height"] as? CGFloat) == CGFloat(1)
          expect(imgData!).to(beginWith("data:image/png;base64,\(expectedImgData)"))
        }
      }

      it("returns JPEG image from the clipboard") {
        let expectedImgData = testImage.jpegData(compressionQuality: 1.0)!.base64EncodedString()
        UIPasteboard.general.image = testImage

        let options = [
          "format": "jpeg"
        ]
        testModuleFunction(function, args: [options]) { (result: [String: Any?]?) in
          let imgData = result!["data"]! as? String?
          let imgSize = result!["size"]! as? [String: Any]
          expect(imgSize!["width"] as? CGFloat) == CGFloat(1)
          expect(imgSize!["height"] as? CGFloat) == CGFloat(1)
          expect(imgData!).to(beginWith("data:image/jpeg;base64,\(expectedImgData)"))
        }
      }

      it("returns nil if no image in the clipboard") {
        UIPasteboard.general.items = []

        let options = [
          "imageFormat": "png"
        ]
        testModuleFunction(function, args: [options]) { (result: UIImage?) in
          expect(result).to(beNil())
        }
      }
    }

    describe("hasImageAsync") {
      let function = "hasImageAsync"

      it("returns true when there is image") {
        UIPasteboard.general.image = UIImage()

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

      it("returns false when items are not images") {
        UIPasteboard.general.items = []
        UIPasteboard.general.string = "not an image"

        testModuleFunction(function, args: []) { (result: Bool?) in
          expect(result) == false
        }
      }
    }

    // MARK: - URLs

    describe("setUrlAsync") {
      it("copies URL to the clipboard") {
        let urlString = "https://expo.dev"

        testModuleFunction("setUrlAsync", args: [urlString]) { (_: Any?) in
          expect(UIPasteboard.general.hasURLs) == true
          expect(UIPasteboard.general.url?.absoluteString) == urlString
        }
      }
    }

    describe("getUrlAsync") {
      let function = "getUrlAsync"

      it("returns URL from the clipboard") {
        let expectedUrl = URL(string: "http://expo.dev")
        UIPasteboard.general.url = expectedUrl

        testModuleFunction(function, args: []) { (result: String?) in
          expect(result) == expectedUrl?.absoluteString
        }
      }

      it("returns nil if no URL in the clipboard") {
        UIPasteboard.general.items = []

        testModuleFunction(function, args: []) { (result: String?) in
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

// TODO: (barthap) Replace this with built-in beFailure() when upgraded to Nimble 10.0
func beFailure<Success, Failure, T: Exception>(exception: T.Type) -> Predicate<Result<Success, Failure>> {
  return Predicate.simple("be \(exception)") { actualExpression in
    guard let actual = try actualExpression.evaluate(),
          case let .failure(error) = actual,
          (error as? Exception)?.rootCause is T
    else {
      return .doesNotMatch
    }
    return .matches
  }
}
