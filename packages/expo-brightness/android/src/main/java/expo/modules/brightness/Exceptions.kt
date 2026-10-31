package expo.modules.brightness

import expo.modules.kotlin.exception.CodedException

class BrightnessPermissionsException :
  CodedException("WRITE_SETTINGS permission has not been granted")

// The code is set explicitly to keep the one that the legacy `InvalidArgumentException` reported.
class UnsupportedBrightnessModeException(mode: Int) :
  CodedException("ERR_INVALID_ARGUMENT", "Unsupported brightness mode $mode", null)
