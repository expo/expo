package expo.modules.mediasession

import io.github.expo.modules.v2.Record

@Record
internal data class InterruptionEvent(
  val type: String,
  val reason: String? = null,
  val shouldResume: Boolean? = null
)

@Record
internal data class RouteChangeEvent(val reason: String)

@Record
internal data class ActivationErrorEvent(val message: String, val client: String)

@Record
internal data class AudioPolicyRecord(
  val playsInSilentMode: Boolean? = null,
  val interruptionMode: InterruptionMode? = null,
  val allowsRecording: Boolean? = null,
  val shouldRouteThroughEarpiece: Boolean? = null
) {
  fun toUpdate() = AudioPolicyUpdate(
    playsInSilentMode = playsInSilentMode,
    interruptionMode = interruptionMode,
    allowsRecording = allowsRecording,
    shouldRouteThroughEarpiece = shouldRouteThroughEarpiece
  )
}

internal fun AudioPolicy.toRecord() = AudioPolicyRecord(
  playsInSilentMode = playsInSilentMode,
  interruptionMode = interruptionMode,
  allowsRecording = allowsRecording,
  shouldRouteThroughEarpiece = shouldRouteThroughEarpiece
)

@Record
internal data class NowPlayingInfoRecord(
  val title: String? = null,
  val artist: String? = null,
  val album: String? = null,
  val artworkUrl: String? = null,
  val duration: Double? = null,
  val elapsedTime: Double? = null,
  val playbackRate: Double? = null,
  val isLiveStream: Boolean? = null,
  val queueIndex: Int? = null,
  val queueCount: Int? = null,
  val skipForwardInterval: Double? = null,
  val skipBackwardInterval: Double? = null
) {
  fun toInfo() = NowPlayingInfo(
    title = title,
    artist = artist,
    album = album,
    artworkUrl = artworkUrl,
    duration = duration,
    elapsedTime = elapsedTime,
    playbackRate = playbackRate,
    isLiveStream = isLiveStream ?: false,
    queueIndex = queueIndex,
    queueCount = queueCount,
    skipForwardInterval = skipForwardInterval,
    skipBackwardInterval = skipBackwardInterval
  )
}

@Record
internal data class RemoteCommandEvent(val kind: String, val value: Double? = null)

@Record
internal data class SessionRequirementsRecord(
  val mixing: MixingRequirement? = null,
  val capabilities: List<String>? = null,
  val continuesInBackground: Boolean? = null
) {
  fun toRequirements() = SessionRequirements(
    mixing = mixing,
    capabilities = capabilities.orEmpty().mapNotNull { capability ->
      when (capability) {
        "record" -> SessionCapability.RECORD
        "measurement" -> SessionCapability.MEASUREMENT
        else -> null
      }
    }.toSet(),
    continuesInBackground = continuesInBackground ?: false
  )
}

@Record
internal data class SessionPauseEvent(val reason: String)

@Record
internal data class SessionDuckEvent(val isDucked: Boolean)

@Record
internal data class SessionFailEvent(val message: String)
