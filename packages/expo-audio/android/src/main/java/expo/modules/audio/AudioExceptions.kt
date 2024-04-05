package expo.modules.audio

import expo.modules.kotlin.exception.CodedException

internal class AudioPermissionsException :
  CodedException("RECORD_AUDIO permission has not been granted")

internal class PausingNotSupportedException :
  CodedException("Pausing is not supported on this device")