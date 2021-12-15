// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore

internal struct ImageContextLostError: CodedError {
  var description: String {
    "Image context has been lost."
  }
}

internal struct ImageDrawingFailedError: CodedError {
  var description: String {
    "Drawing the new image failed."
  }
}

internal struct ImageNotFoundError: CodedError {
  var description: String {
    "Image cannot be found."
  }
}

internal struct ImageColorSpaceNotFoundError: CodedError {
  var description: String {
    "The image does not specify any color space."
  }
}

internal struct ImageInvalidCropError: CodedError {
  var description: String {
    "Invalid crop options has been passed. Please make sure the requested crop rectangle is inside source image."
  }
}

internal struct ImageCropFailedError: CodedError {
  let rect: CGRect
  var description: String {
    "Cropping the image to rectangle (x: \(rect.origin.x), y: \(rect.origin.y), width: \(rect.width), height: \(rect.height)) has failed."
  }
}

internal struct NoImageInContextError: CodedError {
  var description: String {
    "Could not read the image from the drawing context."
  }
}

internal struct ImageLoaderNotFoundError: CodedError {
  var description: String {
    "ImageLoader module not found, make sure \"expo-image-loader\" is linked correctly."
  }
}

internal struct FileSystemNotFoundError: CodedError {
  var description: String {
    "FileSystem module not found, make sure \"expo-file-system\" is linked correctly."
  }
}

internal struct FileSystemReadPermissionError: CodedError {
  let path: String
  var description: String {
    "File \"\(path)\" is not readable."
  }
}

internal struct ImageLoadingFailedError: CodedError {
  let cause: String
  var description: String {
    "Could not load the image: \(cause)"
  }
}

internal struct CorruptedImageDataError: CodedError {
  var description: String {
    "Cannot create image data for given image format."
  }
}

internal struct ImageWriteFailedError: CodedError {
  let cause: String
  var description: String {
    "Writing image data to the file has failed: \(cause)"
  }
}
