package expo.modules.image

import expo.modules.kotlin.exception.CodedException

class ImageLoadFailed(exception: Exception) :
  CodedException(message = "Failed to load the image: ${exception.message}")

class MissingActivity :
  CodedException(message = "The current activity is no longer available")
