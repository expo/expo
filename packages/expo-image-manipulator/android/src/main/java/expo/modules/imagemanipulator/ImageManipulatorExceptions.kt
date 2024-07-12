package expo.modules.imagemanipulator

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.DecoratedException

internal class ImageInvalidCropException :
  CodedException("Invalid crop options has been passed. Please make sure the requested crop rectangle is inside source image")

internal class ImageLoaderNotFoundException :
  CodedException(message = "ImageLoader module not found, make sure 'expo-image-loader' is linked correctly")

internal class ImageLoadingFailedException(image: String, cause: CodedException) :
  DecoratedException(message = "Could not load the image: $image", cause)

internal class ImageWriteFailedException(file: String) :
  CodedException(message = "Writing image data to the file has failed: $file")
