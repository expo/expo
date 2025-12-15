// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

private let defaultBackgroundColor = UIColor.white
private let defaultSpinnerColor = UIColor.systemBlue
private let defaultSpinnerSize = SpinnerSize.medium
private let defaultImageResizeMode = ImageResizeMode.contain

public struct ReloadScreenOptions: Record {
  public init() {}

  @Field var backgroundColor: UIColor = .white
  @Field var image: ReloadScreenImageSource?
  @Field var imageResizeMode: ImageResizeMode = .contain
  @Field var imageFullScreen: Bool = false
  @Field var fade: Bool = false
  @Field var spinner: SpinnerOptions?
}

internal struct ReloadScreenImageSource: Record {
  @Field var url: URL?
  @Field var width: Double?
  @Field var height: Double?
  @Field var scale: Double?
}

internal struct SpinnerOptions: Record {
  @Field var enabled: Bool = true
  @Field var color: UIColor = .systemBlue
  @Field var size: SpinnerSize = .medium
}

struct ReloadScreenConfiguration {
  let backgroundColor: UIColor
  let image: ReloadScreenImageSource?
  let imageResizeMode: ImageResizeMode
  let imageFullScreen: Bool
  let fade: Bool
  let spinner: SpinnerConfiguration

  init(options: ReloadScreenOptions?) {
    let hasImage = options?.image != nil

    backgroundColor = options?.backgroundColor ?? defaultBackgroundColor
    image = options?.image
    imageResizeMode = options?.imageResizeMode ?? defaultImageResizeMode
    imageFullScreen = options?.imageFullScreen ?? false
    fade = options?.fade ?? false
    spinner = SpinnerConfiguration(
      enabled: options?.spinner?.enabled ?? !hasImage,
      color: options?.spinner?.color ?? defaultSpinnerColor,
      size: options?.spinner?.size ?? defaultSpinnerSize
    )
  }
}

struct SpinnerConfiguration {
  let enabled: Bool
  let color: UIColor
  let size: SpinnerSize
}

enum ImageResizeMode: String, Enumerable {
  case contain
  case cover
  case center
  case stretch

#if os(iOS) || os(tvOS)
  var contentMode: UIView.ContentMode {
    switch self {
    case .contain:
      return .scaleAspectFit
    case .cover:
      return .scaleAspectFill
    case .center:
      return .center
    case .stretch:
      return .scaleToFill
    }
  }
  #else
  var contentMode: NSImageScaling {
    switch self {
    case .contain:
      return .scaleProportionallyUpOrDown
    case .cover:
      return .scaleProportionallyDown
    case .center:
      return .scaleNone
    case .stretch:
      return .scaleAxesIndependently
    }
  }
  #endif
}

enum SpinnerSize: String, Enumerable {
  case small
  case medium
  case large

  var spinnerSize: CGFloat {
    switch self {
    case .small:
      return 24.0
    case .medium:
      return 48.0
    case .large:
      return 72.0
    }
  }
}
