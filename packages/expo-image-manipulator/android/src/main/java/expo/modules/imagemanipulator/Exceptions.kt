package expo.modules.imagemanipulator

import expo.modules.kotlin.exception.CodedException

class ImageDecodeException(uri: String, e: Throwable?) :
  CodedException("Could not get decoded bitmap of $uri", e)
