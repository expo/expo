// Copyright 2022-present 650 Industries. All rights reserved.

import Testing
import UIKit
import MobileCoreServices

@testable import ExpoModulesCore
@testable import ExpoClipboard

@Suite("ClipboardModule", .serialized)
@JavaScriptActor
struct ClipboardModuleTests {
  private static let prepareMocks: Void = {
    swizzleGeneralPasteboard()
    swizzleNSAttributedString()
  }()

  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    _ = Self.prepareMocks
    appContext = AppContext.create()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: ClipboardModule(appContext: appContext),
        name: "ExpoClipboard"
      )
    )
  }

  // MARK: - Strings

  @Test
  func `getStringAsync returns plain text from the clipboard`() async throws {
    let expectedString = "hello"
    UIPasteboard.general.string = expectedString

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.getStringAsync({ preferredFormat: 'plainText' })")
    #expect(try result.asString() == expectedString)
  }

  @Test
  func `getStringAsync returns html from the clipboard`() async throws {
    let expectedHtml = "<p>hello</p>"
    UIPasteboard.general.items = [[
      kUTTypeHTML as String: expectedHtml
    ]]

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.getStringAsync({ preferredFormat: 'html' })")
    #expect(try result.asString() == expectedHtml)
  }

  @Test
  func `getStringAsync returns empty string if no text in clipboard`() async throws {
    UIPasteboard.general.items = []

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.getStringAsync({ preferredFormat: 'plainText' })")
    #expect(try result.asString() == "")
  }

  @Test
  func `setStringAsync copies string to clipboard`() async throws {
    let expectedString = "hello"
    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.setStringAsync('\(expectedString)', { inputFormat: 'plainText' })")

    #expect(try result.asBool() == true)
    #expect(UIPasteboard.general.hasStrings == true)
    #expect(UIPasteboard.general.string == expectedString)
  }

  @Test
  func `setStringAsync copies HTML to clipboard`() async throws {
    let expectedHtml = "<p>hello</p>"
    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.setStringAsync('\(expectedHtml)', { inputFormat: 'html' })")
    let mockPasteboard = UIPasteboard.StaticVars.mockPastebaord

    #expect(try result.asBool() == true)
    #expect(mockPasteboard._items.count == 3)
    #expect(mockPasteboard._items[kUTTypeRTF as String] != nil)
    #expect((mockPasteboard._items[kUTTypeHTML as String] as? String)?.contains("hello") == true)
    #expect((mockPasteboard._items[kUTTypeUTF8PlainText as String] as? String)?.contains("hello") == true)
  }

  @Test
  func `hasStringAsync returns true when clipboard contains a string`() async throws {
    UIPasteboard.general.string = "hello world"

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasStringAsync()")
    #expect(try result.asBool() == true)
  }

  @Test
  func `hasStringAsync returns false when there are no items`() async throws {
    UIPasteboard.general.items = []

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasStringAsync()")
    #expect(try result.asBool() == false)
  }

  @Test
  func `hasStringAsync returns false when items are not strings`() async throws {
    UIPasteboard.general.image = UIImage()

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasStringAsync()")
    #expect(try result.asBool() == false)
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
    _ = try await runtime.evalAsync("expo.modules.ExpoClipboard.setImageAsync('\(Self.testImageBase64)')")

    let pasteboardImgData = UIPasteboard.general.image?.pngData()?.base64EncodedString()
    #expect(UIPasteboard.general.hasImages == true)
    // compare first 10 characters only as UIImage can optimize the data so it differs
    #expect(pasteboardImgData?.prefix(10) == Self.testImageBase64.prefix(10))
  }

  @Test
  func `setImageAsync throws when given invalid base64`() async throws {
    let error = try await runtime
      .evalAsync("expo.modules.ExpoClipboard.setImageAsync('invalid').then(() => null, (e) => e)")
      .asObject()
    #expect(error.getProperty("message").getString().contains("Invalid base64 image"))
  }

  @Test
  func `getImageAsync returns PNG image from the clipboard`() async throws {
    let expectedImgData = Self.testImage.pngData()!.base64EncodedString()
    UIPasteboard.general.image = Self.testImage

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.getImageAsync({ format: 'png' })").asObject()
    let imgData = try result.getProperty("data").asString()
    let size = try result.getProperty("size").asObject()
    #expect(try size.getProperty("width").asDouble() == 1)
    #expect(try size.getProperty("height").asDouble() == 1)
    #expect(imgData.hasPrefix("data:image/png;base64,\(expectedImgData)") == true)
  }

  @Test
  func `getImageAsync returns JPEG image from the clipboard`() async throws {
    let expectedImgData = Self.testImage.jpegData(compressionQuality: 1.0)!.base64EncodedString()
    UIPasteboard.general.image = Self.testImage

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.getImageAsync({ format: 'jpeg' })").asObject()
    let imgData = try result.getProperty("data").asString()
    let size = try result.getProperty("size").asObject()
    #expect(try size.getProperty("width").asDouble() == 1)
    #expect(try size.getProperty("height").asDouble() == 1)
    #expect(imgData.hasPrefix("data:image/jpeg;base64,\(expectedImgData)") == true)
  }

  @Test
  func `getImageAsync returns nil if no image in the clipboard`() async throws {
    UIPasteboard.general.items = []

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.getImageAsync({ format: 'png' })")
    #expect(result.isNull() == true)
  }

  @Test
  func `hasImageAsync returns true when there is an image`() async throws {
    UIPasteboard.general.image = UIImage()

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasImageAsync()")
    #expect(try result.asBool() == true)
  }

  @Test
  func `hasImageAsync returns false when there are no items`() async throws {
    UIPasteboard.general.items = []

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasImageAsync()")
    #expect(try result.asBool() == false)
  }

  @Test
  func `hasImageAsync returns false when items are not images`() async throws {
    UIPasteboard.general.items = []
    UIPasteboard.general.string = "not an image"

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasImageAsync()")
    #expect(try result.asBool() == false)
  }

  // MARK: - URLs

  @Test
  func `setUrlAsync copies URL to the clipboard`() async throws {
    let urlString = "https://expo.dev"

    _ = try await runtime.evalAsync("expo.modules.ExpoClipboard.setUrlAsync('\(urlString)')")
    #expect(UIPasteboard.general.hasURLs == true)
    #expect(UIPasteboard.general.url?.absoluteString == urlString)
  }

  @Test
  func `getUrlAsync returns URL from the clipboard`() async throws {
    let expectedUrl = URL(string: "http://expo.dev")
    UIPasteboard.general.url = expectedUrl

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.getUrlAsync()")
    #expect(try result.asString() == expectedUrl?.absoluteString)
  }

  @Test
  func `getUrlAsync returns nil if no URL in the clipboard`() async throws {
    UIPasteboard.general.items = []

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.getUrlAsync()")
    #expect(result.isNull() == true)
  }

  @Test
  func `hasUrlAsync returns true when there is a URL`() async throws {
    UIPasteboard.general.url = URL(string: "https://expo.dev")

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasUrlAsync()")
    #expect(try result.asBool() == true)
  }

  @Test
  func `hasUrlAsync returns false when there are no items`() async throws {
    UIPasteboard.general.items = []

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasUrlAsync()")
    #expect(try result.asBool() == false)
  }

  @Test
  func `hasUrlAsync returns false when items are not URLs`() async throws {
    UIPasteboard.general.items = []
    UIPasteboard.general.string = "not an url"

    let result = try await runtime.evalAsync("expo.modules.ExpoClipboard.hasUrlAsync()")
    #expect(try result.asBool() == false)
  }
}
