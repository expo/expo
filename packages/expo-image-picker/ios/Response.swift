// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal enum Result {
  case Success(Response)
  case Failure(CodedError)
}

internal enum Response {
  case Image(ImageInfo)
  case Video(VideoInfo)

  var dictionary: [String: Any] {
    var result: [String: Any] = [:]
    switch self {
    case .Video(let videoInfo):
      result = videoInfo.dictionary
      break
    case .Image(let imageImage):
      result = imageImage.dictionary
      break
    }
    result["cancelled"] = false
    return result
  }
}

internal struct ImageInfo {
  let type: String = "image"
  let uri: String
  let width: Double
  let height: Double
  let base64: String?
  let exif: [String: Any]?

  var dictionary: [String: Any] {
    var result: [String: Any] = [
      "type": type,
      "uri": uri,
      "width": width,
      "height": height,
    ]
    if (base64 != nil) {
      result["base64"] = base64
    }
    if (exif != nil) {
      result["exif"] = exif
    }
    return result
  }
}

internal struct VideoInfo {
  let type: String = "video"
  let uri: String
  let width: Double
  let height: Double
  let duration: Double

  var dictionary: [String: Any] {
    [
      "type": type,
      "uri": uri,
      "width": width,
      "height": height,
      "duration": duration,
    ]
  }
}
