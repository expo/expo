// Copyright 2022-present 650 Industries. All rights reserved.

import Testing
import UIKit
import MobileCoreServices

@testable import ExpoModulesCore
@testable import ExpoClipboard

@MainActor
@Suite("ClipboardModule", .serialized)
struct ClipboardModuleTests {
  private static let prepareMocks: Void = {
    swizzleGeneralPasteboard()
    swizzleNSAttributedString()
  }()

  let appContext: AppContext
  let holder: ModuleHolder

  init() {
    _ = Self.prepareMocks
    appContext = AppContext.create()
    holder = ModuleHolder(
      appContext: appContext,
      module: ClipboardModule(appContext: appContext),
      name: "ExpoClipboard"
    )
  }

  private func testModuleFunction<T>(_ functionName: String, args: [Any] = []) async throws -> T? {
    return try await withCheckedThrowingContinuation { continuation in
      holder.call(function: functionName, args: args) { result in
        switch result {
        case .success(let value):
          continuation.resume(returning: value as? T)
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }

  private func expectModuleFunctionThrows<T: Exception>(
    _ functionName: String,
    args: [Any],
    exception: T.Type
  ) async {
    await #expect {
      let _: Any? = try await testModuleFunction(functionName, args: args)
    } throws: { error in
      return (error as? Exception)?.rootCause is T
    }
  }

  // MARK: - Strings

  @Test
  func `getStringAsync returns plain text from the clipboard`() async throws {
    let expectedString = "hello"
    UIPasteboard.general.string = expectedString

    let options = ["preferredFormat": "plainText"]
    let result: String? = try await testModuleFunction("getStringAsync", args: [options])
    #expect(result == expectedString)
  }

  @Test
  func `getStringAsync returns html from the clipboard`() async throws {
    let expectedHtml = "<p>hello</p>"
    UIPasteboard.general.items = [[
      kUTTypeHTML as String: expectedHtml
    ]]

    let options = ["preferredFormat": "html"]
    let result: String? = try await testModuleFunction("getStringAsync", args: [options])
    #expect(result == expectedHtml)
  }

  @Test
  func `getStringAsync returns empty string if no text in clipboard`() async throws {
    UIPasteboard.general.items = []

    let options = ["preferredFormat": "plainText"]
    let result: String? = try await testModuleFunction("getStringAsync", args: [options])
    #expect(result == "")
  }

  @Test
  func `setStringAsync copies string to clipboard`() async throws {
    let expectedString = "hello"
    let options = ["inputFormat": "plainText"]
    let result: Bool? = try await testModuleFunction("setStringAsync", args: [expectedString, options])

    #expect(result == true)
    #expect(UIPasteboard.general.hasStrings == true)
    #expect(UIPasteboard.general.string == expectedString)
  }

  @Test
  func `setStringAsync copies HTML to clipboard`() async throws {
    let expectedHtml = "<p>hello</p>"
    let options = ["inputFormat": "html"]
    let result: Bool? = try await testModuleFunction("setStringAsync", args: [expectedHtml, options])
    let mockPasteboard = UIPasteboard.StaticVars.mockPastebaord

    #expect(result == true)
    #expect(mockPasteboard._items.count == 3)
    #expect(mockPasteboard._items[kUTTypeRTF as String] != nil)
    #expect((mockPasteboard._items[kUTTypeHTML as String] as? String)?.contains("hello") == true)
    #expect((mockPasteboard._items[kUTTypeUTF8PlainText as String] as? String)?.contains("hello") == true)
  }

  @Test
  func `hasStringAsync returns true when clipboard contains a string`() async throws {
    UIPasteboard.general.string = "hello world"

    let result: Bool? = try await testModuleFunction("hasStringAsync")
    #expect(result == true)
  }

  @Test
  func `hasStringAsync returns false when there are no items`() async throws {
    UIPasteboard.general.items = []

    let result: Bool? = try await testModuleFunction("hasStringAsync")
    #expect(result == false)
  }

  @Test
  func `hasStringAsync returns false when items are not strings`() async throws {
    UIPasteboard.general.image = UIImage()

    let result: Bool? = try await testModuleFunction("hasStringAsync")
    #expect(result == false)
  }

  // MARK: - Images

  /**
   Base64-encoded PNG data - it's a 1x1 image (a black pixel), 8 bit depth.
   The data has length of 68 bytes after decoding.
   */
  private static let testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
  private static let testImage = UIImage(data: Data(base64Encoded: testImageBase64)!)!

  @Test
  func `setImageAsync copies image to clipboard`() async throws {
    let _: Any? = try await testModuleFunction("setImageAsync", args: [Self.testImageBase64])

    let pasteboardImgData = UIPasteboard.general.image?.pngData()?.base64EncodedString()
    #expect(UIPasteboard.general.hasImages == true)
    // compare first 10 characters only as UIImage can optimize the data so it differs
    #expect(pasteboardImgData?.prefix(10) == Self.testImageBase64.prefix(10))
  }

  @Test
  func `setImageAsync throws when given invalid base64`() async {
    await expectModuleFunctionThrows("setImageAsync", args: ["invalid"], exception: InvalidImageException.self)
  }

  @Test
  func `getImageAsync returns PNG image from the clipboard`() async throws {
    let expectedImgData = Self.testImage.pngData()!.base64EncodedString()
    UIPasteboard.general.image = Self.testImage

    let options = ["format": "png"]
    let result: [String: Any?]? = try await testModuleFunction("getImageAsync", args: [options])

    let imgData = result!["data"]! as? String
    let imgSize = result!["size"]! as? [String: Any]
    #expect(imgSize!["width"] as? CGFloat == CGFloat(1))
    #expect(imgSize!["height"] as? CGFloat == CGFloat(1))
    #expect(imgData?.hasPrefix("data:image/png;base64,\(expectedImgData)") == true)
  }

  @Test
  func `getImageAsync returns JPEG image from the clipboard`() async throws {
    let expectedImgData = Self.testImage.jpegData(compressionQuality: 1.0)!.base64EncodedString()
    UIPasteboard.general.image = Self.testImage

    let options = ["format": "jpeg"]
    let result: [String: Any?]? = try await testModuleFunction("getImageAsync", args: [options])

    let imgData = result!["data"]! as? String
    let imgSize = result!["size"]! as? [String: Any]
    #expect(imgSize!["width"] as? CGFloat == CGFloat(1))
    #expect(imgSize!["height"] as? CGFloat == CGFloat(1))
    #expect(imgData?.hasPrefix("data:image/jpeg;base64,\(expectedImgData)") == true)
  }

  @Test
  func `getImageAsync returns nil if no image in the clipboard`() async throws {
    UIPasteboard.general.items = []

    let options = ["imageFormat": "png"]
    let result: UIImage? = try await testModuleFunction("getImageAsync", args: [options])
    #expect(result == nil)
  }

  @Test
  func `hasImageAsync returns true when there is an image`() async throws {
    UIPasteboard.general.image = UIImage()

    let result: Bool? = try await testModuleFunction("hasImageAsync")
    #expect(result == true)
  }

  @Test
  func `hasImageAsync returns false when there are no items`() async throws {
    UIPasteboard.general.items = []

    let result: Bool? = try await testModuleFunction("hasImageAsync")
    #expect(result == false)
  }

  @Test
  func `hasImageAsync returns false when items are not images`() async throws {
    UIPasteboard.general.items = []
    UIPasteboard.general.string = "not an image"

    let result: Bool? = try await testModuleFunction("hasImageAsync")
    #expect(result == false)
  }

  // MARK: - URLs

  @Test
  func `setUrlAsync copies URL to the clipboard`() async throws {
    let urlString = "https://expo.dev"

    let _: Any? = try await testModuleFunction("setUrlAsync", args: [urlString])
    #expect(UIPasteboard.general.hasURLs == true)
    #expect(UIPasteboard.general.url?.absoluteString == urlString)
  }

  @Test
  func `getUrlAsync returns URL from the clipboard`() async throws {
    let expectedUrl = URL(string: "http://expo.dev")
    UIPasteboard.general.url = expectedUrl

    let result: String? = try await testModuleFunction("getUrlAsync")
    #expect(result == expectedUrl?.absoluteString)
  }

  @Test
  func `getUrlAsync returns nil if no URL in the clipboard`() async throws {
    UIPasteboard.general.items = []

    let result: String? = try await testModuleFunction("getUrlAsync")
    #expect(result == nil)
  }

  @Test
  func `hasUrlAsync returns true when there is a URL`() async throws {
    UIPasteboard.general.url = URL(string: "https://expo.dev")

    let result: Bool? = try await testModuleFunction("hasUrlAsync")
    #expect(result == true)
  }

  @Test
  func `hasUrlAsync returns false when there are no items`() async throws {
    UIPasteboard.general.items = []

    let result: Bool? = try await testModuleFunction("hasUrlAsync")
    #expect(result == false)
  }

  @Test
  func `hasUrlAsync returns false when items are not URLs`() async throws {
    UIPasteboard.general.items = []
    UIPasteboard.general.string = "not an url"

    let result: Bool? = try await testModuleFunction("hasUrlAsync")
    #expect(result == false)
  }
}
