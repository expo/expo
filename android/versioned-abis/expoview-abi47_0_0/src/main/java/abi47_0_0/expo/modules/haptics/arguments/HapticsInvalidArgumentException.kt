package abi47_0_0.expo.modules.haptics.arguments

import abi47_0_0.expo.modules.core.errors.CodedException

class HapticsInvalidArgumentException internal constructor(message: String?) : CodedException(message) {
  override fun getCode(): String {
    return "E_HAPTICS_INVALID_ARGUMENT"
  }
}
