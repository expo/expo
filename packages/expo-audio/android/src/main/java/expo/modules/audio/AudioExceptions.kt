package expo.modules.audio

import expo.modules.kotlin.exception.CodedException

private const val defaultPlaybackServiceTip =
  "Make sure that the expo-audio config plugin is properly configured with " +
    "'enableBackgroundPlayback: true' to avoid issues with lock screen controls " +
    "and background audio playback."

private const val defaultRecordingServiceTip =
  "Make sure that the expo-audio config plugin is properly configured with " +
    "'enableBackgroundRecording: true' to avoid issues with background recording."

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

internal fun getPlaybackServiceErrorMessage(
  message: String?,
  tip: String = defaultPlaybackServiceTip
): String {
  return (message ?: "expo-audio playback service error") + ". $tip"
}

internal fun getRecordingServiceErrorMessage(
  message: String?,
  tip: String = defaultRecordingServiceTip
): String {
  return (message ?: "expo-audio recording service error") + ". $tip"
}

internal class AudioRecordingServiceException(message: String?, cause: Throwable? = null) :
  CodedException(getRecordingServiceErrorMessage(message), cause)

internal class AudioPlaybackServiceException(message: String?, cause: Throwable? = null) :
  CodedException(getPlaybackServiceErrorMessage(message), cause)
