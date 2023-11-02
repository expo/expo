// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct GetImageOptions: Record {
  @Field("format")
  var imageFormat: ImageFormat = .jpeg
  
  @Field
  var jpegQuality: Double = 1.0
}

enum ImageFormat: String, EnumArgument {
  case jpeg
  case png
  case gif
  func getMimeType() -> String {
    switch self {
      case .jpeg:
        return "image/jpeg"
      case .png:
        return "image/png"
      case .gif:
        return "image/gif"
    }
  }
}

struct GetStringOptions: Record {
  @Field
  var preferredFormat: StringFormat = .plainText
}

struct SetStringOptions: Record {
  @Field
  var inputFormat: StringFormat = .plainText
}

enum StringFormat: String, EnumArgument {
  case plainText
  case html
}
