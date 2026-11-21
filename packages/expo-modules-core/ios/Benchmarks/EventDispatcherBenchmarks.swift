// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Foundation
import Testing

@testable import ExpoModulesCore

/// Benchmarks for connecting the `EventDispatcher` properties of a view to its events. Expo views are not
/// recycled, so this runs for each event of each new view.
extension Benchmarks {
  @Test
  func `install event dispatchers: 5 events after 26 other properties`() async throws {
    try await benchmarkCase {
      let view = EventDispatchersBenchmarkView()
      benchmark("install event dispatchers: 5 events after 26 other properties", runtime: nil) { iterations in
        for _ in 0..<iterations {
          for eventName in EventDispatchersBenchmarkView.eventNames {
            installEventDispatcher(forEvent: eventName, onView: view) { _ in }
          }
        }
      }
    }
  }
}

/// Has the same stored properties as expo-image's `ImageView`, with types from Foundation.
private final class EventDispatchersBenchmarkView {
  static let eventNames = ["onLoadStart", "onProgress", "onError", "onLoad", "onDisplay"]

  let imageView = NSObject()
  let imageManager = NSObject()
  var loadingOptions: String.CompareOptions = [.caseInsensitive]
  var sources: [URL]?
  var sourceImage: NSObject?
  var pendingOperation: NSObject?
  var pendingSVGVariablesTask: Task<Void, Never>?
  var pendingAssetCatalogBlurTask: Task<Void, Never>?
  var contentFit: FloatingPointRoundingRule = .toNearestOrEven
  var contentPosition: CGPoint = .zero
  var transition: TimeInterval?
  var blurRadius: CGFloat = 0.0
  var imageTintColor: NSObject?
  var svgVariables: [String: String]?
  var cachePolicy: URLRequest.CachePolicy = .useProtocolCachePolicy
  var allowDownscaling: Bool = true
  var lockResource: Bool = false
  var enforceEarlyResizing: Bool = false
  var autoplay: Bool = true
  var sfEffect: [String]?
  var symbolWeight: String?
  var symbolSize: Double?
  var useAppleWebpCodec: Bool = true
  var isSFSymbolSource: Bool = false
  var imageLayoutSize: CGSize = .zero
  var maskObservation: NSKeyValueObservation?

  let onLoadStart = EventDispatcher()
  let onProgress = EventDispatcher()
  let onError = EventDispatcher()
  let onLoad = EventDispatcher()
  let onDisplay = EventDispatcher()
}
