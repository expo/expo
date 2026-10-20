// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct GetImageOptions: Record {
  @Field("format")
  var imageFormat: ImageFormat = .jpeg

  @Field
  var jpegQuality: Double = 1.0
}

internal enum ImageFormat: String, Enumerable {
  case jpeg
  case png

  func getMimeType() -> String {
    switch self {
    case .jpeg:
      return "image/jpeg"
    case .png:
      return "image/png"
    }
  }
}

internal struct GetStringOptions: Record {
  @Field
  var preferredFormat: StringFormat = .plainText
}

internal struct SetStringOptions: Record {
  @Field
  var inputFormat: StringFormat = .plainText

  /// Keeps the item off other devices' Universal Clipboard.
  @Field
  var localOnly: Bool = false

  /// Unix time in milliseconds when the system removes the item.
  @Field
  var expiresAt: Double?
}

internal struct SetImageOptions: Record {}

internal enum StringFormat: String, Enumerable {
  case plainText
  case html
}
