package expo.modules.image

import expo.modules.kotlin.exception.CodedException

class ImagePrefetchFailure(message: String) :
  CodedException(message = "Failed to prefetch the image: $message")

class ImageLoadAborted : CodedException(message = "Aborted loading the image")

class MissingActivity :
  CodedException(message = "The current activity is no longer available")
