package expo.modules.audio

import expo.modules.kotlin.exception.CodedException

internal class AudioPermissionsException :
  CodedException("RECORD_AUDIO permission has not been granted")

internal class GetAudioInputNotSupportedException :
  CodedException("Getting current audio input is not supported on devices running Android version lower than Android 9.0")

internal class SetAudioInputNotSupportedException :
  CodedException("Setting current audio input is not supported on devices running Android version lower than Android 9.0")

internal class DeviceInfoNotFoundException :
  CodedException("Cannot get current input, AudioDeviceInfo not found.")

internal class PreferredInputNotFoundException :
  CodedException("Could not set preferred device input")

internal class AudioRecorderPrepareException(cause: Throwable) :
  CodedException("Failed to prepare the AudioRecorder", cause)

internal class AudioRecorderAlreadyPreparedException :
  CodedException("AudioRecorder has already been prepared. Stop or release the current session before preparing again.")
