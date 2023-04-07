package expo.modules.brightness

import expo.modules.kotlin.exception.CodedException

class SetBrightnessException :
  CodedException("Failed to set the current screen brightness")

class BrightnessPermissionsException :
  CodedException("WRITE_SETTINGS permission has not been granted")
