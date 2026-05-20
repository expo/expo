// Copyright 2018-present 650 Industries. All rights reserved.

import CoreGraphics
import Testing

@testable import ExpoModulesCore

@Suite("Convertibles")
struct ConvertiblesTests {
  let appContext: AppContext

  init() {
    appContext = AppContext.create()
  }

  // MARK: - URL

  @Suite("URL")
  struct URLTests {
    let appContext: AppContext

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `converts from remote url`() throws {
      let remoteUrlString = "https://expo.dev"
      let url = try URL.convert(from: remoteUrlString, appContext: appContext)

      #expect(url.path == "")
      #expect(url.absoluteString == remoteUrlString)
    }

    @Test
    func `converts from url with unencoded query`() throws {
      let query = "param=🥓"
      let urlString = "https://expo.dev/?\(query)"
      let url = try URL.convert(from: urlString, appContext: appContext)

      if #available(iOS 16.0, *) {
        #expect(url.query(percentEncoded: true) == "param=%F0%9F%A5%93")
        #expect(url.query(percentEncoded: false) == query)
      }
      #expect(url.query == "param=%F0%9F%A5%93")
      #expect(url.absoluteString == "https://expo.dev/?param=%F0%9F%A5%93")
      #expect(url.absoluteString.removingPercentEncoding == urlString)
    }

    @Test
    func `converts from url with encoded query`() throws {
      let query = "param=%F0%9F%A5%93"
      let urlString = "https://expo.dev/?\(query)"
      let url = try URL.convert(from: urlString, appContext: appContext)

      if #available(iOS 16.0, *) {
        #expect(url.query(percentEncoded: true) == query)
        #expect(url.query(percentEncoded: false) == "param=🥓")
      }
      #expect(url.query == query)
      #expect(url.absoluteString == urlString)
      #expect(url.absoluteString.removingPercentEncoding == "https://expo.dev/?param=🥓")
    }

    @Test
    func `converts from url with encoded query containing the anchor`() throws {
      let query = "color=%230000ff"
      let urlString = "https://expo.dev/?\(query)#anchor"
      let url = try URL.convert(from: urlString, appContext: appContext)

      #expect(url.query == query)
      #expect(url.absoluteString == urlString)
      #expect(url.absoluteString.removingPercentEncoding == "https://expo.dev/?color=#0000ff#anchor")
      #expect(url.fragment == "anchor")
    }

    @Test
    func `converts from url with encoded path`() throws {
      let path = "/expo/%2F%25%3F%5E%26/test" // -> /expo//%?^&/test
      let urlString = "https://expo.dev\(path)"
      let url = try URL.convert(from: urlString, appContext: appContext)

      #expect(url.absoluteString == urlString)
      #expect(url.path == path.removingPercentEncoding)

      if #available(iOS 16.0, *) {
        #expect(url.path(percentEncoded: true) == path)
        #expect(url.path(percentEncoded: false) == path.removingPercentEncoding)
      }
    }

    @Test
    func `converts from url containing the anchor`() throws {
      // The hash is not allowed in the query (requires percent-encoding),
      // but we want it to be recognized as the beginning of the fragment,
      // thus it cannot be percent-encoded.
      let query = "param=#expo"
      let urlString = "https://expo.dev/?\(query)"
      let url = try URL.convert(from: urlString, appContext: appContext)

      #expect(url.query == "param=")
      #expect(url.fragment == "expo")
      #expect(url.absoluteString == urlString)
    }

    @Test
    func `converts from file url`() throws {
      let fileUrlString = "file:///expo/tmp"
      let url = try URL.convert(from: fileUrlString, appContext: appContext)

      #expect(url.path == "/expo/tmp")
      #expect(url.absoluteString == fileUrlString)
      #expect(url.isFileURL == true)
    }

    @Test
    func `converts from file path`() throws {
      let filePath = "/expo/image.png"
      let url = try URL.convert(from: filePath, appContext: appContext)

      #expect(url.scheme == "file")
      #expect(url.path == filePath)
      #expect(url.absoluteString == "file://\(filePath)")
      #expect(url.isFileURL == true)
    }

    @Test
    func `converts from file path with UTF8 characters`() throws {
      let filePath = "/中文ÅÄÖąÓśĆñ.gif"
      let url = try URL.convert(from: filePath, appContext: appContext)

      #expect(url.scheme == "file")
      #expect(url.path == filePath)
      #expect(url.isFileURL == true)
    }

    @Test
    func `converts from file path containing percent character`() throws {
      let filePath = "/%.png"
      let url = try URL.convert(from: filePath, appContext: appContext)

      #expect(url.scheme == "file")
      #expect(url.path == filePath)
      #expect(url.isFileURL == true)
    }

    @Test
    func `throws when no string`() {
      #expect(throws: Conversions.ConvertingException<URL>.self) {
        try URL.convert(from: 29.5, appContext: appContext)
      }
    }
  }

  // MARK: - CGPoint

  @Suite("CGPoint")
  struct CGPointTests {
    let appContext: AppContext
    let x = -8.3
    let y = 4.6

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `converts from array of doubles`() throws {
      let point = try CGPoint.convert(from: [x, y], appContext: appContext)

      #expect(Double(point.x) == x)
      #expect(Double(point.y) == y)
    }

    @Test
    func `converts from dict`() throws {
      let point = try CGPoint.convert(from: ["x": x, "y": y], appContext: appContext)

      #expect(Double(point.x) == x)
      #expect(Double(point.y) == y)
    }

    @Test
    func `throws when array size is unexpected`() {
      #expect(throws: Conversions.ConvertingException<CGPoint>.self) {
        try CGPoint.convert(from: [], appContext: appContext)
      }
      #expect(throws: Conversions.ConvertingException<CGPoint>.self) {
        try CGPoint.convert(from: [x], appContext: appContext)
      }
      #expect(throws: Conversions.ConvertingException<CGPoint>.self) {
        try CGPoint.convert(from: [x, y, x], appContext: appContext)
      }
    }

    @Test
    func `throws when dict is missing some keys`() {
      #expect {
        try CGPoint.convert(from: ["test": x], appContext: appContext)
      } throws: { error in
        guard let missingKeysError = error as? Conversions.MissingKeysException<Double> else {
          return false
        }
        return missingKeysError.description == Conversions.MissingKeysException<Double>(["x", "y"]).description
      }
    }

    @Test
    func `throws when dict has uncastable keys`() {
      #expect {
        try CGPoint.convert(from: ["x": x, "y": "string"], appContext: appContext)
      } throws: { error in
        guard let castingError = error as? Conversions.CastingValuesException<Double> else {
          return false
        }
        return castingError.description == Conversions.CastingValuesException<Double>(["y"]).description
      }
    }
  }

  // MARK: - CGSize

  @Suite("CGSize")
  struct CGSizeTests {
    let appContext: AppContext
    let width = 52.8
    let height = 81.7

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `converts from array of doubles`() throws {
      let size = try CGSize.convert(from: [width, height], appContext: appContext)

      #expect(Double(size.width) == width)
      #expect(Double(size.height) == height)
    }

    @Test
    func `converts from dict`() throws {
      let size = try CGSize.convert(from: ["width": width, "height": height], appContext: appContext)

      #expect(Double(size.width) == width)
      #expect(Double(size.height) == height)
    }

    @Test
    @JavaScriptActor
    func `converts from JS array and object through the value converter`() throws {
      let arrayValue = try appContext.runtime.eval("[4, 3]")
      let objectValue = try appContext.runtime.eval("({ width: 4, height: 3 })")

      #expect(try appContext.converter.toNative(arrayValue, ~CGSize.self) as? CGSize == CGSize(width: 4, height: 3))
      #expect(try appContext.converter.toNative(objectValue, ~CGSize.self) as? CGSize == CGSize(width: 4, height: 3))
    }

    @Test
    func `throws when array size is unexpected`() {
      #expect(throws: Conversions.ConvertingException<CGSize>.self) {
        try CGSize.convert(from: [], appContext: appContext)
      }
      #expect(throws: Conversions.ConvertingException<CGSize>.self) {
        try CGSize.convert(from: [width], appContext: appContext)
      }
      #expect(throws: Conversions.ConvertingException<CGSize>.self) {
        try CGSize.convert(from: [width, height, width], appContext: appContext)
      }
    }

    @Test
    func `throws when dict is missing some keys`() {
      #expect {
        try CGSize.convert(from: ["width": width], appContext: appContext)
      } throws: { error in
        guard let missingKeysError = error as? Conversions.MissingKeysException<Double> else {
          return false
        }
        return missingKeysError.description == Conversions.MissingKeysException<Double>(["height"]).description
      }
    }

    @Test
    func `throws when dict has uncastable keys`() {
      #expect {
        try CGSize.convert(from: ["width": "test", "height": height], appContext: appContext)
      } throws: { error in
        guard let castingError = error as? Conversions.CastingValuesException<Double> else {
          return false
        }
        return castingError.description == Conversions.CastingValuesException<Double>(["width"]).description
      }
    }
  }

  // MARK: - CGVector

  @Suite("CGVector")
  struct CGVectorTests {
    let appContext: AppContext
    let dx = 11.6
    let dy = -4.0

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `converts from array of doubles`() throws {
      let vector = try CGVector.convert(from: [dx, dy], appContext: appContext)

      #expect(Double(vector.dx) == dx)
      #expect(Double(vector.dy) == dy)
    }

    @Test
    func `converts from dict`() throws {
      let vector = try CGVector.convert(from: ["dx": dx, "dy": dy], appContext: appContext)

      #expect(Double(vector.dx) == dx)
      #expect(Double(vector.dy) == dy)
    }

    @Test
    func `throws when array size is unexpected`() {
      #expect(throws: Conversions.ConvertingException<CGVector>.self) {
        try CGVector.convert(from: [], appContext: appContext)
      }
      #expect(throws: Conversions.ConvertingException<CGVector>.self) {
        try CGVector.convert(from: [dx], appContext: appContext)
      }
      #expect(throws: Conversions.ConvertingException<CGVector>.self) {
        try CGVector.convert(from: [dx, dy, dx], appContext: appContext)
      }
    }

    @Test
    func `throws when dict is missing some keys`() {
      #expect {
        try CGVector.convert(from: ["dx": dx], appContext: appContext)
      } throws: { error in
        guard let missingKeysError = error as? Conversions.MissingKeysException<Double> else {
          return false
        }
        return missingKeysError.description
          == Conversions.MissingKeysException<Double>(["dy"]).description
      }
    }

    @Test
    func `throws when dict has uncastable keys`() {
      #expect {
        try CGVector.convert(from: ["dx": "dx", "dy": dy], appContext: appContext)
      } throws: { error in
        guard let castingError = error as? Conversions.CastingValuesException<Double> else {
          return false
        }
        return castingError.description
          == Conversions.CastingValuesException<Double>(["dx"]).description
      }
    }
  }

  // MARK: - CGRect

  @Suite("CGRect")
  struct CGRectTests {
    let appContext: AppContext
    let x = -8.3
    let y = 4.6
    let width = 52.8
    let height = 81.7

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `converts from array of doubles`() throws {
      let rect = try CGRect.convert(from: [x, y, width, height], appContext: appContext)

      #expect(Double(rect.origin.x) == x)
      #expect(Double(rect.origin.y) == y)
      #expect(Double(rect.width) == width)
      #expect(Double(rect.height) == height)
    }

    @Test
    func `converts from dict`() throws {
      let rect = try CGRect.convert(from: ["x": x, "y": y, "width": width, "height": height], appContext: appContext)

      #expect(Double(rect.origin.x) == x)
      #expect(Double(rect.origin.y) == y)
      #expect(Double(rect.width) == width)
      #expect(Double(rect.height) == height)
    }

    @Test
    func `throws when array size is unexpected`() {
      #expect(throws: Conversions.ConvertingException<CGRect>.self) {
        try CGRect.convert(from: [x], appContext: appContext)
      }
      #expect(throws: Conversions.ConvertingException<CGRect>.self) {
        try CGRect.convert(from: [x, y], appContext: appContext)
      }
      #expect(throws: Conversions.ConvertingException<CGRect>.self) {
        try CGRect.convert(from: [x, y, width, height, y], appContext: appContext)
      }
    }

    @Test
    func `throws when dict is missing some keys`() {
      #expect {
        try CGRect.convert(from: ["x": x], appContext: appContext)
      } throws: { error in
        guard let missingKeysError = error as? Conversions.MissingKeysException<Double> else {
          return false
        }
        return missingKeysError.description == Conversions.MissingKeysException<Double>(["y", "width", "height"]).description
      }
    }

    @Test
    func `throws when dict has uncastable keys`() {
      #expect {
        try CGRect.convert(from: ["x": x, "y": nil, "width": width, "height": "\(height)"], appContext: appContext)
      } throws: { error in
        guard let castingError = error as? Conversions.CastingValuesException<Double> else {
          return false
        }
        return castingError.description == Conversions.CastingValuesException<Double>(["y", "height"]).description
      }
    }
  }

  // MARK: - Date

  @Suite("Date")
  struct DateTests {
    let appContext: AppContext

    init() {
      appContext = AppContext.create()
    }

    @Test
    func `converts from ISO 8601 String to Date`() throws {
      let date = try Date.convert(from: "2023-12-27T10:58:20.654Z", appContext: appContext)
      let components = Calendar.current.dateComponents([.day, .month], from: date)
      #expect(components.month == 12)
      #expect(components.day == 27)
    }

    @Test
    func `converts from Date.now() to Date`() throws {
      let date = try Date.convert(from: 1703718341639, appContext: appContext)
      // The current calendar uses the local timezone, so basically the `day` component
      // could differ depending on the current timezone. Set it to GMT for correctness.
      let components = Calendar.current.dateComponents(in: TimeZone(abbreviation: "GMT")!, from: date)

      #expect(components.month == 12)
      #expect(components.day == 27)
    }
  }
}
