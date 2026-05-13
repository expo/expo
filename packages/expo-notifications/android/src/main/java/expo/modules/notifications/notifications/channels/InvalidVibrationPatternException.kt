package expo.modules.notifications.notifications.channels

import expo.modules.core.errors.CodedRuntimeException

class InvalidVibrationPatternException(invalidValueKey: Int, invalidValue: Any?) :
  CodedRuntimeException("Invalid value in vibration pattern, expected all elements to be numbers, got: $invalidValue under $invalidValueKey") {

  override fun getCode() = "ERR_INVALID_VIBRATION_PATTERN"
}
