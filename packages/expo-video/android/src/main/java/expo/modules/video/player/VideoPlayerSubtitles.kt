package expo.modules.video.player

import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.Format
import androidx.media3.common.MimeTypes
import androidx.media3.common.TrackGroup
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.TrackSelectionParameters
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import expo.modules.video.listeners.VideoPlayerListener
import expo.modules.video.records.SubtitleTrack
import java.lang.ref.WeakReference

@OptIn(UnstableApi::class)
class VideoPlayerSubtitles(owner: VideoPlayer) : VideoPlayerListener {
  private val owner = WeakReference(owner)
  private val videoPlayer: VideoPlayer?
    get() {
      return owner.get()
    }
  private val formatsToGroups = mutableMapOf<Format, Pair<TrackGroup, Int>>()
  private var currentSubtitleFormat: Format? = null
  private var currentOverride: TrackSelectionOverride? = null

  var currentSubtitleTrack: SubtitleTrack?
    get() {
      return SubtitleTrack.fromFormat(currentSubtitleFormat)
    }
    set(value) {
      applySubtitleTrack(value)
    }
  val availableSubtitleTracks = arrayListOf<SubtitleTrack>()

  init {
    owner.addListener(this)
  }

  fun setSubtitlesEnabled(enabled: Boolean) {
    val currentParams = videoPlayer?.player?.trackSelectionParameters ?: return
    var params = currentParams.buildUpon().setTrackTypeDisabled(C.TRACK_TYPE_TEXT, !enabled).build()
    if (!enabled) {
      params = params.buildUpon().clearOverridesOfType(C.TRACK_TYPE_TEXT).build()
    }
    videoPlayer?.player?.trackSelectionParameters = params
  }

  // VideoPlayerListener
  override fun onTrackSelectionParametersChanged(player: VideoPlayer, trackSelectionParameters: TrackSelectionParameters) {
    currentSubtitleFormat = findSelectedSubtitleFormat()
    super.onTrackSelectionParametersChanged(player, trackSelectionParameters)
  }

  override fun onTracksChanged(player: VideoPlayer, tracks: Tracks) {
    formatsToGroups.clear()
    availableSubtitleTracks.clear()
    for (group in tracks.groups) {
      for (i in 0..<group.length) {
        val format: Format = group.getTrackFormat(i)

        if (MimeTypes.isText(format.sampleMimeType)) {
          formatsToGroups[format] = Pair(group.mediaTrackGroup, i)
          val track = SubtitleTrack.fromFormat(format) ?: continue
          availableSubtitleTracks.add(track)
        }
      }
    }
    currentSubtitleFormat = findSelectedSubtitleFormat()
    super.onTracksChanged(player, tracks)
  }

  // Private methods
  private fun applySubtitleTrack(subtitleTrack: SubtitleTrack?) {
    val player = videoPlayer?.player ?: return
    var newParameters: TrackSelectionParameters = player.trackSelectionParameters
    currentOverride?.let { override ->
      newParameters = newParameters.buildUpon().clearOverridesOfType(C.TRACK_TYPE_TEXT).build()
    }
    if (subtitleTrack == null) {
      player.trackSelectionParameters = newParameters
      setSubtitlesEnabled(false)
      currentOverride = null
      return
    }
    val format = formatsToGroups.keys.firstOrNull {
      it.id == subtitleTrack.id
    }
    format?.let {
      formatsToGroups[it]?.let { subtitlePair ->
        val override = TrackSelectionOverride(subtitlePair.first, subtitlePair.second)
        newParameters = newParameters.buildUpon().addOverride(override).build()
        player.trackSelectionParameters = newParameters
        setSubtitlesEnabled(true)
        currentOverride = override
      }
    }
  }

  private fun findSelectedSubtitleFormat(): Format? {
    val trackSelectionParameters = videoPlayer?.player?.trackSelectionParameters
    val preferredTextLanguages = trackSelectionParameters?.preferredTextLanguages
    val overriddenFormat: Format? = trackSelectionParameters?.overrides?.let {
      for ((group, override) in it) {
        if (group.type == C.TRACK_TYPE_TEXT) {
          // For subtitles only one index will be replaced
          return@let override.trackIndices.firstOrNull()?.let { index ->
            group.getFormat(index)
          }
        }
      }
      return@let null
    }

    val preferredFormat: Format? = preferredTextLanguages?.let { preferredTextLanguages ->
      for (preferredLanguage in preferredTextLanguages) {
        return@let formatsToGroups.keys.firstOrNull {
          it.language == preferredLanguage
        }
      }
      return@let null
    }

    return overriddenFormat ?: preferredFormat
  }
}
