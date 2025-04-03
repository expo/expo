package expo.modules.haptics.arguments

import expo.modules.core.errors.CodedException

class HapticsInvalidArgumentException internal constructor(message: String?) : CodedException(message) {
  override fun getCode(): String {
    return "E_HAPTICS_INVALID_ARGUMENT"
  }
}

class HapticTypeNotSupportedException(type: String) : CodedException("This device doesn't support the selected haptic type: $type")

class HapticsNotSupportedException : CodedException("A haptics engine is not available on this device")
