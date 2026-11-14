// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

/// Represents a shared reference to the `UIImage` instance.
@SharedObject("Image")
public final class ImageRef: SharedRef<UIImage> {
  public override var nativeRefType: String {
    "image"
  }

  @JS
  var width: Int {
    return ref.cgImage?.width ?? 0
  }

  @JS
  var height: Int {
    return ref.cgImage?.height ?? 0
  }

  // Encoding the image and writing the file block the thread, so `.concurrent` runs it off the JS thread.
  @JS(.concurrent)
  func saveAsync(options: ManipulateOptions?) async throws -> ImageResult {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }
    let options = options ?? ManipulateOptions()
    let result = try saveImage(ref, options: options, appContext: appContext)

    // We're returning a record instead of a path directly because in the future we'll replace it
    // with a shared ref to the file once this feature gets implemented in expo-file-system.
    // This should be fully backwards-compatible switch.
    return ImageResult(
      uri: result.url.absoluteString,
      width: ref.cgImage?.width ?? 0,
      height: ref.cgImage?.height ?? 0,
      base64: options.base64 ? result.data.base64EncodedString() : nil
    )
  }

  public override func getAdditionalMemoryPressure() -> Int {
    guard let cgImage = ref.cgImage else {
      return 0
    }
    return cgImage.bytesPerRow * cgImage.height
  }
}
