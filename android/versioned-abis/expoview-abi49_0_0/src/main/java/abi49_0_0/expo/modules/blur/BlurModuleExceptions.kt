package abi49_0_0.expo.modules.blur

import abi49_0_0.expo.modules.kotlin.exception.CodedException

internal class InvalidTintValueException(tint: String) :
  CodedException("Invalid tint value provided: $tint")
