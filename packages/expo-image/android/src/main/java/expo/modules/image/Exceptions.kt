package expo.modules.image

import expo.modules.kotlin.exception.CodedException

class ImageLoadFailed(exception: Exception) :
  CodedException(message = "Failed to load the image: ${exception.message}")

class WriteToCacheRemoteSourceException(uri: String) :
  CodedException(
    message = "Cannot write a remote image to the cache from the URL: '$uri'. " +
      "Pass a local file URI (for example one returned by 'expo-image-picker' or 'expo-file-system'), " +
      "or use 'prefetch' to cache a remote image"
  )

class WriteToCacheReadException(path: String) :
  CodedException(
    message = "Unable to read the image file at: '$path'. Make sure the file exists and is readable"
  )

class WriteToCacheEncodeException :
  CodedException(message = "Unable to encode the image reference for the cache")
