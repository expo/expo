// Copyright 2022-present 650 Industries. All rights reserved.

// swiftlint:disable redundant_optional_initialization
// Unfortunately, property wrappers must be initialized in those records, otherwise the memberwise initializer
// would require `Field<FieldType?>` as an argument instead of `FieldType?`.
// TODO: (@tsapeta) Figure out if we can fix that

import ExpoModulesCore

internal typealias ImagePickerResult = Result<ImagePickerResponse, Exception>

internal typealias SelectedMediaResult = Result<AssetInfo, Exception>

/**
 Convenience alias, a dictionary representing EXIF data
 */
internal typealias ExifInfo = [String: Any]

/**
 Represents a picker response.
 */
internal struct ImagePickerResponse: Record {
  @Field var assets: [AssetInfo]? = nil
  @Field var canceled: Bool = true
}

/**
 Represents a single asset (image or video).
 */
internal struct AssetInfo: Record {
  @Field var assetId: String? = nil
  @Field var type: String = "image"
  @Field var uri: String = ""
  @Field var width: Double = 0
  @Field var height: Double = 0
  @Field var fileName: String? = nil
  @Field var fileSize: Int? = nil
  @Field var mimeType: String? = nil
  @Field var base64: String? = nil
  @Field var exif: ExifInfo? = nil
  @Field var duration: Double? = nil
}
