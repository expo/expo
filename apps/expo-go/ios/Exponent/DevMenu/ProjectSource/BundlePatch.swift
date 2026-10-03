// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Pure text generation for the patched bundle: the require-shim factory,
/// the `__d` interceptor that swaps factories at definition time, and the
/// marker framing that lets a patched bundle be recognized and stripped.
enum BundlePatch {
  static let startMarker = "//<expo-source-explorer-patch>"
  static let endMarker = "//</expo-source-explorer-patch>"

  static func factory(moduleCode: String, indexByName: [String: Int]) throws -> String {
    let mapJSON = try String(
      data: JSONSerialization.data(
        withJSONObject: indexByName,
        options: [.sortedKeys, .withoutEscapingSlashes]
      ),
      encoding: .utf8
    ) ?? "{}"
    return """
      function(g, r, i, a, m, e, d) {
      var __depIndexByName = \(mapJSON);
      var require = function(name) { return r(d[__depIndexByName[name]]); };
      var module = m, exports = e, global = g;
      \(moduleCode)
      }
      """
  }

  static func interceptor(overrides: [(moduleId: Int, factory: String)]) -> String {
    let overrideLines = overrides
      .map { "overrides[\($0.moduleId)] = \($0.factory);" }
      .joined(separator: "\n")
    return """
      \(startMarker)
      (function(global) {
      var overrides = {};
      \(overrideLines)
      var realDefine;
      Object.defineProperty(global, '__d', {
        configurable: true,
        get: function() {
          if (!realDefine) { return undefined; }
          return function(factory, moduleId, dependencyMap) {
            return realDefine(overrides[moduleId] || factory, moduleId, dependencyMap);
          };
        },
        set: function(value) { realDefine = value; }
      });
      })(typeof globalThis !== 'undefined' ? globalThis : this);
      \(endMarker)

      """
  }

  static func strippingExistingPatch(from bundle: Data) -> Data {
    let start = Data((startMarker + "\n").utf8)
    guard bundle.starts(with: start) else { return bundle }
    let end = Data(("\n" + endMarker + "\n").utf8)
    guard let endRange = bundle.range(of: end) else { return bundle }
    return bundle.subdata(in: endRange.upperBound..<bundle.count)
  }
}
