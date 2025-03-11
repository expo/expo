// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore

internal final class ImageContextLostException: Exception {
  override var reason: String {
    "Image context has been lost"
  }
}

internal final class ImageDrawingFailedException: Exception {
  override var reason: String {
    "Drawing the new image failed"
  }
}

internal final class ImageNotFoundException: Exception {
  override var reason: String {
    "Image cannot be found"
  }
}

internal final class ImageColorSpaceNotFoundException: Exception {
  override var reason: String {
    "The image does not specify any color space"
  }
}

internal final class ImageInvalidCropException: Exception {
  override var reason: String {
    "Invalid crop options has been passed. Please make sure the requested crop rectangle is inside source image"
  }
}

internal final class ImageCropFailedException: GenericException<CGRect> {
  override var reason: String {
    "Cropping the image to rectangle (x: \(param.origin.x), y: \(param.origin.y), width: \(param.width), height: \(param.height)) has failed"
  }
}

internal final class NoImageInContextException: Exception {
  override var reason: String {
    "Could not read the image from the drawing context"
  }
}

internal final class ImageLoaderNotFoundException: Exception {
  override var reason: String {
    "ImageLoader module not found, make sure 'expo-image-loader' is linked correctly"
  }
}

internal final class FileSystemNotFoundException: Exception {
  override var reason: String {
    "FileSystem module not found, make sure 'expo-file-system' is linked correctly"
  }
}

internal final class FileSystemReadPermissionException: GenericException<String> {
  override var reason: String {
    "File '\(param)' is not readable"
  }
}

internal final class ImageLoadingFailedException: GenericException<String> {
  override var reason: String {
    "Could not load the image: \(param)"
  }
}

internal final class CorruptedImageDataException: Exception {
  override var reason: String {
    "Cannot create image data for given image format"
  }
}

internal final class ImageWriteFailedException: GenericException<String> {
  override var reason: String {
    "Writing image data to the file has failed: \(param)"
  }
}
