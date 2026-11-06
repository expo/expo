// Copyright 2026-present 650 Industries. All rights reserved.

import CoreText
import ExpoModulesTestCore
import Testing
import UIKit

@testable import ExpoFont
@testable import ExpoModulesCore

/// Calls the font modules from JavaScript, so the arguments and the results go through the same
/// conversions as in an app.
@Suite("FontModules")
@JavaScriptActor
struct FontModulesTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: FontLoaderModule(appContext: appContext),
        name: "ExpoFontLoader"
      )
    )
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: FontUtilsModule(appContext: appContext),
        name: "ExpoFontUtils"
      )
    )
    _ = try runtime.eval(
      """
      var FontLoader = expo.modules.ExpoFontLoader;
      var FontUtils = expo.modules.ExpoFontUtils;
      // Resolves to the code of the error that rejects the promise, or to 'resolved'.
      function rejectionCode(promise) {
        return promise.then(
          function () {
            return 'resolved';
          },
          function (error) {
            return String(error.code);
          }
        );
      }
      """
    )
  }

  /// The file URL of a font that ships with the system, so the tests don't need a font fixture.
  func systemFontUrl() throws -> URL {
    let font = CTFontCreateWithName("Courier" as CFString, 12, nil)
    return try #require(CTFontCopyAttribute(font, kCTFontURLAttribute) as? URL)
  }

  /// An alias that no other test uses, because the alias registry is process-wide.
  func uniqueAlias() -> String {
    return "ExpoFontTest-\(UUID().uuidString)"
  }

  // MARK: - ExpoFontLoader

  @Test
  func `loadAsync makes the font available under the alias`() async throws {
    let alias = uniqueAlias()
    let fontUrl = try systemFontUrl()

    _ = try await runtime.evalAsync("FontLoader.loadAsync('\(alias)', '\(fontUrl.absoluteString)')")

    #expect(try runtime.eval("FontLoader.getLoadedFonts().includes('\(alias)')").asBool() == true)
    #expect(!UIFont.fontNames(forFamilyName: alias).isEmpty)
  }

  @Test
  func `loadFontFamilyAsync makes the faces available under the alias`() async throws {
    let alias = uniqueAlias()
    let fontUrl = try systemFontUrl()

    _ = try await runtime.evalAsync(
      """
      FontLoader.loadFontFamilyAsync('\(alias)', [
        { localUri: '\(fontUrl.absoluteString)', weight: 400, style: 'normal' },
      ])
      """
    )

    #expect(try runtime.eval("FontLoader.getLoadedFonts().includes('\(alias)')").asBool() == true)
    #expect(!UIFont.fontNames(forFamilyName: alias).isEmpty)
  }

  @Test
  func `loadFontFamilyAsync rejects a family without faces`() async throws {
    let result = try await runtime.evalAsync("rejectionCode(FontLoader.loadFontFamilyAsync('\(uniqueAlias())', []))")
    #expect(try result.asString() == FontFamilyEmptyFacesException("").code)
  }

  @Test
  func `loadFontFamilyAsync rejects a face without localUri`() async throws {
    let result = try await runtime.evalAsync(
      "rejectionCode(FontLoader.loadFontFamilyAsync('\(uniqueAlias())', [{ weight: 400 }]))"
    )
    #expect(try result.asString() == FontFaceMissingUriException("").code)
  }

  // MARK: - ExpoFontUtils

  @Test
  func `renderToImageAsync resolves to a PNG file and its size`() async throws {
    let result = try await runtime.evalAsync(
      """
      FontUtils.renderToImageAsync('Ag', { size: 32, color: 'red', lineHeight: 40 }).then(function (image) {
        return [image.uri, image.width, image.height, image.scale].join(' ');
      })
      """
    )
    let parts = try result.asString().split(separator: " ").map(String.init)
    try #require(parts.count == 4)

    let fileUrl = try #require(URL(string: parts[0]))
    #expect(fileUrl.isFileURL)
    #expect(UIImage(contentsOfFile: fileUrl.path) != nil)
    #expect(try #require(Double(parts[1])) > 0)
    #expect(try #require(Double(parts[2])) == 40)
    #expect(try #require(Double(parts[3])) > 0)
    try? FileManager.default.removeItem(at: fileUrl)
  }
}
