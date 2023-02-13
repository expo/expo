package abi48_0_0.expo.modules.image

import abi48_0_0.expo.modules.kotlin.exception.CodedException

class ImagePrefetchFailure(message: String) :
  CodedException(message = "Failed to prefetch the image: $message")

class MissingActivity :
  CodedException(message = "The current activity is no longer available")
