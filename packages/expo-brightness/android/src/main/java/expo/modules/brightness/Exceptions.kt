package expo.modules.brightness

import expo.modules.kotlin.exception.CodedException

class BrightnessPermissionsException :
  CodedException("WRITE_SETTINGS permission has not been granted")
