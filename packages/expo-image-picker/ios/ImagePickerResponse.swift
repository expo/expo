// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal typealias ImagePickerResult = Result<ImagePickerResponse, Exception>

internal typealias SelectedMediaResult = Result<SelectedMediaInfo, Exception>

/**
 General protocol representing a picker response
 */
internal protocol ImagePickerResponse {
  var dictionary: [String: Any] { get }
}

/**
 Represents a picker response, when multiple selection is disabled
 */
internal enum ImagePickerSingleResponse: ImagePickerResponse {
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

/**
 Represents a picker response, when multiple selection is enabled
 */
internal struct ImagePickerMultipleResponse: ImagePickerResponse {
  let results: [SelectedMediaInfo]

  var dictionary: [String: Any] {
    [
      "cancelled": false,
      "selected": results.map { $0.dictionary }
    ]
  }
}

/**
 Convenience alias, a dictionary representing EXIF data
 */
internal typealias ExifInfo = [String: Any]

/**
 General protocol representing a single selected asset
 */
internal protocol SelectedMediaInfo {
  var dictionary: [String: Any] { get }
}

/**
 Represents a single selected image
 */
internal struct ImageInfo: SelectedMediaInfo {
  let assetId: String?
  let type: String = "image"
  let uri: String
  let width: Double
  let height: Double
  let fileName: String?
  let fileSize: Int?
  let base64: String?
  let exif: ExifInfo?

  var dictionary: [String: Any] {
    var result: [String: Any] = [
      "type": type,
      "uri": uri,
      "assetId": assetId,
      "width": width,
      "height": height,
      "fileName": fileName,
      "fileSize": fileSize
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

/**
 Represents a single selected video
 */
internal struct VideoInfo: SelectedMediaInfo {
  let assetId: String?
  let type: String = "video"
  let uri: String
  let width: Double
  let height: Double
  let fileName: String?
  let fileSize: Int?
  let duration: Double

  var dictionary: [String: Any] {
    [
      "type": type,
      "uri": uri,
      "assetId": assetId,
      "width": width,
      "height": height,
      "fileName": fileName,
      "fileSize": fileSize,
      "duration": duration
    ]
  }
}
