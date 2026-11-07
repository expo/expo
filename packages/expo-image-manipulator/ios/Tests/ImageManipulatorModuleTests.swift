// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing
import UIKit

@testable import ExpoImageManipulator
@testable import ExpoModulesCore

/// Calls the module from JavaScript, so the arguments and the results go through the same
/// conversions as in an app.
@Suite("ImageManipulatorModule")
@JavaScriptActor
struct ImageManipulatorModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: ImageManipulatorModule(appContext: appContext),
        name: "ExpoImageManipulator"
      )
    )
    _ = try runtime.eval(
      """
      var ImageManipulator = expo.modules.ExpoImageManipulator;
      // A 100x50 PNG image.
      var source = 'data:image/png;base64,\(Self.sourceBase64)';
      function size(image) {
        return image.width + 'x' + image.height;
      }
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

  private static let sourceBase64: String = {
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let image = UIGraphicsImageRenderer(size: CGSize(width: 100, height: 50), format: format).image { context in
      UIColor.red.setFill()
      context.fill(CGRect(x: 0, y: 0, width: 100, height: 50))
    }
    // swiftlint:disable:next force_unwrapping
    return image.pngData()!.base64EncodedString()
  }()

  @Test
  func `manipulate returns a context and each transform returns the same context`() throws {
    let result = try runtime.eval(
      """
      var context = ImageManipulator.manipulate(source);
      [
        context instanceof ImageManipulator.Context,
        context.resize({ width: 50 }) === context,
        context.rotate(90) === context,
        context.flip('vertical') === context,
        context.crop({ originX: 0, originY: 0, width: 10, height: 10 }) === context,
        context.reset() === context,
      ].join(' ')
      """
    )
    #expect(try result.asString() == "true true true true true true")
  }

  @Test
  func `renderAsync resolves to an image with the transforms applied`() async throws {
    let result = try await runtime.evalAsync(
      """
      ImageManipulator.manipulate(source)
        .resize({ width: 50 })
        .rotate(90)
        .renderAsync()
        .then(function (image) {
          return [image instanceof ImageManipulator.Image, image instanceof expo.SharedRef, size(image)].join(' ');
        })
      """
    )
    #expect(try result.asString() == "true true 25x50")
  }

  @Test
  func `reset discards the transforms added before it`() async throws {
    let result = try await runtime.evalAsync(
      """
      ImageManipulator.manipulate(source).resize({ width: 50 }).reset().flip('horizontal').renderAsync().then(size)
      """
    )
    #expect(try result.asString() == "100x50")
  }

  @Test
  func `manipulate accepts a rendered image as the source`() async throws {
    let result = try await runtime.evalAsync(
      """
      ImageManipulator.manipulate(source).renderAsync().then(function (image) {
        return ImageManipulator.manipulate(image, { maxWidth: 50 }).rotate(-90).renderAsync();
      }).then(size)
      """
    )
    #expect(try result.asString() == "25x50")
  }

  @Test
  func `saveAsync resolves to the file uri and the size without base64 by default`() async throws {
    let result = try await runtime.evalAsync(
      """
      ImageManipulator.manipulate(source).crop({ originX: 10, originY: 0, width: 40, height: 30 }).renderAsync().then(function (image) {
        return image.saveAsync();
      }).then(function (result) {
        return [
          Object.keys(result).sort().join(','),
          /^file:.*\\/ImageManipulator\\/[^/]+\\.jpg$/.test(result.uri),
          size(result),
          result.base64 === null,
        ].join(' ');
      })
      """
    )
    #expect(try result.asString() == "base64,height,uri,width true 40x30 true")
  }

  @Test
  func `saveAsync encodes the image in the requested format`() async throws {
    let result = try await runtime.evalAsync(
      """
      ImageManipulator.manipulate(source).renderAsync().then(function (image) {
        return image.saveAsync({ format: 'png', base64: true });
      }).then(function (result) {
        return [/\\.png$/.test(result.uri), result.base64.slice(0, 8)].join(' ');
      })
      """
    )
    // `iVBORw0K` is the base64 PNG signature.
    #expect(try result.asString() == "true iVBORw0K")
  }

  @Test
  func `renderAsync rejects a crop outside of the image`() async throws {
    let result = try await runtime.evalAsync(
      """
      rejectionCode(ImageManipulator.manipulate(source).crop({ originX: 0, originY: 0, width: 200, height: 10 }).renderAsync())
      """
    )
    #expect(try result.asString() == "ERR_IMAGE_INVALID_CROP")
  }
}
