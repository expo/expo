// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct GetImageOptions: Record {
  @Field("format")
  var imageFormat: ImageFormat = .jpeg

  @Field
  var jpegQuality: Double = 1.0
}

internal enum ImageFormat: String, EnumArgument {
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
  var preferredType: StringContentType = .plainText
}

internal struct SetStringOptions: Record {
  @Field
  var inputType: StringContentType = .plainText
}

internal enum StringContentType: String, EnumArgument {
  case plainText
  case html
}
