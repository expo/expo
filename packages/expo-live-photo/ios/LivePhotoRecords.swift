// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Photos

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct LivePhotoAsset: Record {
  @Field var photoUri: URL? = nil
  @Field var pairedVideoUri: URL? = nil

  func toLivePhotoStream(targetSize: CGSize, contentFit: ContentFit = .contain) throws -> AsyncThrowingStream<(Bool, PHLivePhoto), Error> {
    guard
      let photoUri,
      let pairedVideoUri
    else {
      throw InvalidSourceException("the `photoUri` and `pairedVideoUri` have to be provided")
    }

    // When placeholder is nil it will be the default image by default
    return PHLivePhoto.requestSequence(
      withResourceFileURLs: [photoUri, pairedVideoUri],
      placeholderImage: nil,
      targetSize: targetSize,
      contentMode: contentFit.toContentMode()
    )
  }
}

struct LivePhotoLoadError: Record {
  @Field
  var message: String = "Unknown error"
}
// swiftlint:enable redundant_optional_initialization
