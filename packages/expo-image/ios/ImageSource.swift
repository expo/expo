// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct ImageSource: Record {
  @Field
  var width: Double = 0.0

  @Field
  var height: Double = 0.0

  @Field
  var uri: URL? = nil

  @Field
  var scale: Double = 1.0

  @Field
  var headers: [String: String]?

  @Field
  var cacheKey: String?

  var pixelCount: Double {
    return width * height * scale * scale
  }

  var isBlurhash: Bool {
    return uri?.scheme == "blurhash"
  }

  var isThumbhash: Bool {
    return uri?.scheme == "thumbhash"
  }

  var isPhotoLibraryAsset: Bool {
    return isPhotoLibraryAssetUrl(uri)
  }

  var cacheOriginalImage: Bool {
    return !isPhotoLibraryAsset
  }
}
