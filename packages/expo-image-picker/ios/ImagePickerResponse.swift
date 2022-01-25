// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal enum AsyncResult {
  case success(ImagePickerResponse)
  case failure(Exception)
}

internal enum ImagePickerResponse {
  case image(ImageInfo)
  case video(VideoInfo)

  var dictionary: [String: Any] {
    var result: [String: Any] = [:]
    switch self {
    case .video(let videoInfo):
      result = videoInfo.dictionary
    case .image(let imageImage):
      result = imageImage.dictionary
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
      "height": height
    ]
    if base64 != nil {
      result["base64"] = base64
    }
    if exif != nil {
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
      "duration": duration
    ]
  }
}
