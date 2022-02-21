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

  func getBase64Prefix() -> String {
    switch self {
    case .jpeg:
      return "data:image/jpeg;base64,"
    case .png:
      return "data:image/png;base64,"
    }
  }
}
