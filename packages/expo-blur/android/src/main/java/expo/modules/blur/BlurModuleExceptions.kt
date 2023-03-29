package expo.modules.blur

import expo.modules.kotlin.exception.CodedException

internal class InvalidTintValueException(tint: String) :
  CodedException("Invalid tint value provided: $tint")
