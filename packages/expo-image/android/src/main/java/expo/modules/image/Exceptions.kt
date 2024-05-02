package expo.modules.image

import expo.modules.kotlin.exception.CodedException

class MissingActivity :
  CodedException(message = "The current activity is no longer available")
