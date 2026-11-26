// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore

// MARK: - Props

@Record
struct ImageView2Source {
  var uri: URL?
  var width: Double = 0
  var height: Double = 0
  var scale: Double = 1
  var headers: [String: String]?
  var cacheKey: String?

  /// The same source as the type that the SDWebImage context and the custom loaders read.
  func toImageSource() -> ImageSource {
    // `ImageSource` stores its fields in `@Field` wrappers, so setting them doesn't mutate the struct.
    let source = ImageSource()
    source.uri = uri
    source.width = width
    source.height = height
    source.scale = scale
    source.headers = headers
    source.cacheKey = cacheKey
    return source
  }
}

@Union
enum ImageView2PositionValue {
  case number(Double)
  case string(String)
}

@Record
struct ImageView2ContentPosition {
  var top: ImageView2PositionValue?
  var bottom: ImageView2PositionValue?
  var right: ImageView2PositionValue?
  var left: ImageView2PositionValue?
}

@Record
struct ImageView2LoadedSource {
  var url: String?
  var width: Double
  var height: Double
  var mediaType: String?
  var isAnimated: Bool
}

@Record
struct ImageView2LoadEvent {
  var cacheType: String
  var source: ImageView2LoadedSource
}

@Record
struct ImageView2ProgressEvent {
  var loaded: Int?
  var total: Int?
  var progress: Double
}

@Record
struct ImageView2ErrorEvent {
  var error: String
}

/// An image that is already loaded, such as one from `Image.loadAsync`, or a list of sources to pick the best one from.
@Union
enum ImageView2SourceValue {
  // Must stay first: an array decodes any object as a one-element array, and every field of a source is
  // optional, so an image ref would also decode as a source without a URI.
  case image(SharedRef<UIImage>)
  case sources([ImageView2Source])
}

@Record
struct ImageView2Transition {
  var duration: Double = 100
  var timing: ImageTransitionTiming = .easeInOut
  var effect: ImageTransitionEffect = .crossDissolve
  var skipOnCacheHit: ImageTransitionCacheSkip = .none

  /// Whether the transition plays when the view displays an image from the given cache. It always plays
  /// when the view replaces an image that it already displays.
  func shouldPlay(cacheType: ImageCacheType, isInitialDisplay: Bool) -> Bool {
    guard duration > 0 else {
      return false
    }
    return !isInitialDisplay || !skipOnCacheHit.skips(cacheType: cacheType)
  }

  var animationOptions: UIView.AnimationOptions {
    return [timing.toAnimationOption(), effect.toAnimationOption()]
  }
}

@ViewProps
public struct ImageView2Props {
  var source: ImageView2SourceValue?
  var contentFit: ContentFit = .cover
  var contentPosition: ImageView2ContentPosition?
  var cachePolicy: ImageCachePolicy = .disk
  var transition: ImageView2Transition?
  var recyclingKey: String?
  var autoplay: Bool = true
  var onLoadStart: () -> Void
  var onProgress: (ImageView2ProgressEvent) -> Void
  var onLoad: (ImageView2LoadEvent) -> Void
  var onError: (ImageView2ErrorEvent) -> Void
  var onDisplay: () -> Void
}

// MARK: - Load key

/// The inputs that decide which image a load gets. A props update or a layout restarts the load
/// only when they change.
struct ImageView2LoadKey: Equatable {
  let uri: URL?
  let headers: [String: String]?
  let cacheKey: String?
  let scale: Double
  let cachePolicy: ImageCachePolicy

  init(source: ImageSource, cachePolicy: ImageCachePolicy) {
    self.uri = source.uri
    self.headers = source.headers
    self.cacheKey = source.cacheKey
    self.scale = source.scale
    self.cachePolicy = cachePolicy
  }
}
