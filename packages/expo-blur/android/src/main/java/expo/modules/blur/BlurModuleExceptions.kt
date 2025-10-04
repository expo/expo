package expo.modules.blur

import expo.modules.kotlin.exception.CodedException

internal class InvalidTintValueException(tint: String) :
  CodedException("Invalid tint value provided: $tint")

internal class DuplicateBlurTargetIdException() :
  CodedException("You have registered multiple BlurTargetViews without providing an unique `blurTargetId` prop. Every `BlurTargetView` has to have an unique blur target identifier.")

internal class InvalidBlurTargetIdException(val info: String?) :
  CodedException("The provided blur target id is invalid.${info?.let { " $it" } ?: ""}")

internal class BlurViewConfigurationException(override val message: String) :
  CodedException("Failed to create a blur target: $message")
