package expo.modules.haptics.arguments

import expo.modules.kotlin.exception.CodedException

class HapticTypeNotSupportedException(type: String) :
  CodedException("This device doesn't support the selected haptic type: $type")
