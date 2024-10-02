package expo.modules.video.player

import androidx.media3.common.C
import androidx.media3.common.Timeline
import androidx.media3.common.util.Assertions
import androidx.media3.common.util.Log
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.LoadControl
import androidx.media3.exoplayer.Renderer
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.source.TrackGroupArray
import androidx.media3.exoplayer.trackselection.ExoTrackSelection
import androidx.media3.exoplayer.upstream.Allocator
import androidx.media3.exoplayer.upstream.DefaultAllocator
import expo.modules.video.records.BufferOptions
import kotlin.math.max
import kotlin.math.min

/**
 * Default LoadControl implementation copied from ExoPlayer source (auto-converted to Kotlin)
 * Modified to allow changing buffer parameters during playback.
 */

/** The default [LoadControl] implementation.  */
@UnstableApi
class VideoPlayerLoadControl
private constructor(
  allocator: DefaultAllocator,
  minBufferMs: Int,
  maxBufferMs: Int,
  bufferForPlaybackMs: Int,
  bufferForPlaybackAfterRebufferMs: Int,
  targetBufferBytes: Int,
  prioritizeTimeOverSizeThresholds: Boolean,
  backBufferDurationMs: Int,
  retainBackBufferFromKeyframe: Boolean
) : LoadControl {
  /** Builder for [DefaultLoadControl].  */
  class Builder {
    private var allocator: DefaultAllocator? = null
    private var minBufferMs: Int
    private var maxBufferMs: Int
    private var bufferForPlaybackMs: Int
    private var bufferForPlaybackAfterRebufferMs: Int
    private var targetBufferBytes: Int
    private var prioritizeTimeOverSizeThresholds: Boolean
    private var backBufferDurationMs: Int
    private var retainBackBufferFromKeyframe: Boolean
    private var buildCalled = false

    /** Constructs a new instance.  */
    init {
      minBufferMs = DEFAULT_MIN_BUFFER_MS
      maxBufferMs = DEFAULT_MAX_BUFFER_MS
      bufferForPlaybackMs = DEFAULT_BUFFER_FOR_PLAYBACK_MS
      bufferForPlaybackAfterRebufferMs = DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
      targetBufferBytes = DEFAULT_TARGET_BUFFER_BYTES
      prioritizeTimeOverSizeThresholds = DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS
      backBufferDurationMs = DEFAULT_BACK_BUFFER_DURATION_MS
      retainBackBufferFromKeyframe = DEFAULT_RETAIN_BACK_BUFFER_FROM_KEYFRAME
    }

    /**
     * Sets the [DefaultAllocator] used by the loader.
     *
     * @param allocator The [DefaultAllocator].
     * @return This builder, for convenience.
     * @throws IllegalStateException If [.build] has already been called.
     */
    fun setAllocator(allocator: DefaultAllocator?): Builder {
      Assertions.checkState(!buildCalled)
      this.allocator = allocator
      return this
    }

    /**
     * Sets the buffer duration parameters.
     *
     * @param minBufferMs The minimum duration of media that the player will attempt to ensure is
     * buffered at all times, in milliseconds.
     * @param maxBufferMs The maximum duration of media that the player will attempt to buffer, in
     * milliseconds.
     * @param bufferForPlaybackMs The duration of media that must be buffered for playback to start
     * or resume following a user action such as a seek, in milliseconds.
     * @param bufferForPlaybackAfterRebufferMs The default duration of media that must be buffered
     * for playback to resume after a rebuffer, in milliseconds. A rebuffer is defined to be
     * caused by buffer depletion rather than a user action.
     * @return This builder, for convenience.
     * @throws IllegalStateException If [.build] has already been called.
     */
    fun setBufferDurationsMs(
      minBufferMs: Int,
      maxBufferMs: Int,
      bufferForPlaybackMs: Int,
      bufferForPlaybackAfterRebufferMs: Int
    ): Builder {
      Assertions.checkState(!buildCalled)
      assertGreaterOrEqual(bufferForPlaybackMs, 0, "bufferForPlaybackMs", "0")
      assertGreaterOrEqual(
        bufferForPlaybackAfterRebufferMs,
        0,
        "bufferForPlaybackAfterRebufferMs",
        "0"
      )
      assertGreaterOrEqual(minBufferMs, bufferForPlaybackMs, "minBufferMs", "bufferForPlaybackMs")
      assertGreaterOrEqual(
        minBufferMs,
        bufferForPlaybackAfterRebufferMs,
        "minBufferMs",
        "bufferForPlaybackAfterRebufferMs"
      )
      assertGreaterOrEqual(maxBufferMs, minBufferMs, "maxBufferMs", "minBufferMs")
      this.minBufferMs = minBufferMs
      this.maxBufferMs = maxBufferMs
      this.bufferForPlaybackMs = bufferForPlaybackMs
      this.bufferForPlaybackAfterRebufferMs = bufferForPlaybackAfterRebufferMs
      return this
    }

    /**
     * Sets the target buffer size in bytes. If set to [C.LENGTH_UNSET], the target buffer
     * size will be calculated based on the selected tracks.
     *
     * @param targetBufferBytes The target buffer size in bytes.
     * @return This builder, for convenience.
     * @throws IllegalStateException If [.build] has already been called.
     */
    fun setTargetBufferBytes(targetBufferBytes: Int): Builder {
      Assertions.checkState(!buildCalled)
      this.targetBufferBytes = targetBufferBytes
      return this
    }

    /**
     * Sets whether the load control prioritizes buffer time constraints over buffer size
     * constraints.
     *
     * @param prioritizeTimeOverSizeThresholds Whether the load control prioritizes buffer time
     * constraints over buffer size constraints.
     * @return This builder, for convenience.
     * @throws IllegalStateException If [.build] has already been called.
     */
    fun setPrioritizeTimeOverSizeThresholds(prioritizeTimeOverSizeThresholds: Boolean): Builder {
      Assertions.checkState(!buildCalled)
      this.prioritizeTimeOverSizeThresholds = prioritizeTimeOverSizeThresholds
      return this
    }

    /**
     * Sets the back buffer duration, and whether the back buffer is retained from the previous
     * keyframe.
     *
     * @param backBufferDurationMs The back buffer duration in milliseconds.
     * @param retainBackBufferFromKeyframe Whether the back buffer is retained from the previous
     * keyframe.
     * @return This builder, for convenience.
     * @throws IllegalStateException If [.build] has already been called.
     */
    fun setBackBuffer(backBufferDurationMs: Int, retainBackBufferFromKeyframe: Boolean): Builder {
      Assertions.checkState(!buildCalled)
      assertGreaterOrEqual(backBufferDurationMs, 0, "backBufferDurationMs", "0")
      this.backBufferDurationMs = backBufferDurationMs
      this.retainBackBufferFromKeyframe = retainBackBufferFromKeyframe
      return this
    }

    /** Creates a [DefaultLoadControl].  */
    fun build(): VideoPlayerLoadControl {
      Assertions.checkState(!buildCalled)
      buildCalled = true
      if (allocator == null) {
        allocator = DefaultAllocator( /* trimOnReset= */true, C.DEFAULT_BUFFER_SEGMENT_SIZE)
      }
      return VideoPlayerLoadControl(
        allocator!!,
        minBufferMs,
        maxBufferMs,
        bufferForPlaybackMs,
        bufferForPlaybackAfterRebufferMs,
        targetBufferBytes,
        prioritizeTimeOverSizeThresholds,
        backBufferDurationMs,
        retainBackBufferFromKeyframe
      )
    }
  }

  private var minBufferUs: Long
  private var maxBufferUs: Long
  private var bufferForPlaybackUs: Long
  private var bufferForPlaybackAfterRebufferUs: Long
  private var targetBufferBytesOverwrite: Int
  private var prioritizeTimeOverSizeThresholds: Boolean
  private val backBufferDurationUs: Long
  private val retainBackBufferFromKeyframe: Boolean

  private var targetBufferBytes: Int
  private var isLoading = false

  private var renderers: Array<Renderer>? = null
  private var trackSelections: Array<ExoTrackSelection>? = null

  private val allocator: DefaultAllocator

  var targetBufferMs: Long = DEFAULT_MAX_BUFFER_MS.toLong()
    set(value) {
      minBufferUs = Util.msToUs(value)
      maxBufferUs = Util.msToUs(value)
    }

  var bufferForPlaybackMs: Long = DEFAULT_BUFFER_FOR_PLAYBACK_MS.toLong()
    set(value) {
      bufferForPlaybackUs = Util.msToUs(value)
    }

  var bufferForPlaybackAfterRebufferMs: Long = DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS.toLong()
    set(value) {
      bufferForPlaybackAfterRebufferUs = Util.msToUs(value)
    }

  /** Constructs a new instance, using the `DEFAULT_*` constants defined in this class.  */
  constructor() : this(
    DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE),
    DEFAULT_MIN_BUFFER_MS,
    DEFAULT_MAX_BUFFER_MS,
    DEFAULT_BUFFER_FOR_PLAYBACK_MS,
    DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS,
    DEFAULT_TARGET_BUFFER_BYTES,
    DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS,
    DEFAULT_BACK_BUFFER_DURATION_MS,
    DEFAULT_RETAIN_BACK_BUFFER_FROM_KEYFRAME
  )

  init {
    assertGreaterOrEqual(bufferForPlaybackMs, 0, "bufferForPlaybackMs", "0")
    assertGreaterOrEqual(
      bufferForPlaybackAfterRebufferMs,
      0,
      "bufferForPlaybackAfterRebufferMs",
      "0"
    )
    assertGreaterOrEqual(minBufferMs, bufferForPlaybackMs, "minBufferMs", "bufferForPlaybackMs")
    assertGreaterOrEqual(
      minBufferMs,
      bufferForPlaybackAfterRebufferMs,
      "minBufferMs",
      "bufferForPlaybackAfterRebufferMs"
    )
    assertGreaterOrEqual(maxBufferMs, minBufferMs, "maxBufferMs", "minBufferMs")
    assertGreaterOrEqual(backBufferDurationMs, 0, "backBufferDurationMs", "0")

    this.allocator = allocator
    this.minBufferUs = Util.msToUs(minBufferMs.toLong())
    this.maxBufferUs = Util.msToUs(maxBufferMs.toLong())
    this.bufferForPlaybackUs = Util.msToUs(bufferForPlaybackMs.toLong())
    this.bufferForPlaybackAfterRebufferUs = Util.msToUs(bufferForPlaybackAfterRebufferMs.toLong())
    this.targetBufferBytesOverwrite = targetBufferBytes
    this.targetBufferBytes =
      if (targetBufferBytesOverwrite != C.LENGTH_UNSET
      ) {
        targetBufferBytesOverwrite
      } else {
        DEFAULT_MIN_BUFFER_SIZE
      }
    this.prioritizeTimeOverSizeThresholds = prioritizeTimeOverSizeThresholds
    this.backBufferDurationUs = Util.msToUs(backBufferDurationMs.toLong())
    this.retainBackBufferFromKeyframe = retainBackBufferFromKeyframe
  }

  fun applyBufferOptions(bufferOptions: BufferOptions) {
    bufferOptions.preferredForwardBufferDuration?.let {
      targetBufferMs = (it * 1000).toLong()
    } ?: run {
      targetBufferMs = DEFAULT_MAX_BUFFER_MS.toLong()
    }

    targetBufferBytesOverwrite = if (bufferOptions.maxBufferBytes == 0L) {
      C.LENGTH_UNSET
    } else {
      bufferOptions.maxBufferBytes.toInt()
    }

    if (targetBufferBytesOverwrite != C.LENGTH_UNSET) {
      targetBufferBytes = targetBufferBytesOverwrite
    }

    applyBufferBytes()

    prioritizeTimeOverSizeThresholds = bufferOptions.prioritizeTimeOverSizeThreshold

    val optionsBufferForPlaybackMs = bufferOptions.minBufferForPlayback * 1000
    val safeBufferForPlayback = if (optionsBufferForPlaybackMs > targetBufferMs) {
      targetBufferMs
    } else {
      bufferOptions.minBufferForPlayback
    }
    bufferForPlaybackMs = safeBufferForPlayback.toLong()
    bufferForPlaybackAfterRebufferMs = safeBufferForPlayback.toLong()
  }

  private fun applyBufferBytes() {
    val calculatedBufferBytes = this.renderers?.let { renderers ->
      this.trackSelections?.let { trackSelections ->
        calculateTargetBufferBytes(renderers, trackSelections)
      }
    }

    if (targetBufferBytesOverwrite == C.LENGTH_UNSET && calculatedBufferBytes != null) {
      allocator.setTargetBufferSize(calculatedBufferBytes)
      targetBufferBytes = calculatedBufferBytes
    } else {
      allocator.setTargetBufferSize(targetBufferBytesOverwrite)
    }
  }

  override fun onPrepared() {
    reset(false)
  }

  override fun onTracksSelected(
    timeline: Timeline,
    mediaPeriodId: MediaSource.MediaPeriodId,
    renderers: Array<Renderer>,
    trackGroups: TrackGroupArray,
    trackSelections: Array<ExoTrackSelection>
  ) {
    this.renderers = renderers
    this.trackSelections = trackSelections
    applyBufferBytes()
  }

  override fun onStopped() {
    reset(true)
  }

  override fun onReleased() {
    reset(true)
  }

  override fun getAllocator(): Allocator {
    return allocator
  }

  override fun getBackBufferDurationUs(): Long {
    return backBufferDurationUs
  }

  override fun retainBackBufferFromKeyframe(): Boolean {
    return retainBackBufferFromKeyframe
  }

  override fun shouldContinueLoading(
    playbackPositionUs: Long,
    bufferedDurationUs: Long,
    playbackSpeed: Float
  ): Boolean {
    val targetBufferSizeReached = allocator.totalBytesAllocated >= targetBufferBytes
    var minBufferUs = this.minBufferUs
    if (playbackSpeed > 1) {
      // The playback speed is faster than real time, so scale up the minimum required media
      // duration to keep enough media buffered for a playout duration of minBufferUs.
      val mediaDurationMinBufferUs =
        Util.getMediaDurationForPlayoutDuration(minBufferUs, playbackSpeed)
      minBufferUs = min(mediaDurationMinBufferUs.toDouble(), maxBufferUs.toDouble()).toLong()
    }
    // Prevent playback from getting stuck if minBufferUs is too small.
    minBufferUs = max(minBufferUs.toDouble(), 500000.0).toLong()
    if (bufferedDurationUs < minBufferUs) {
      isLoading = prioritizeTimeOverSizeThresholds || !targetBufferSizeReached
      if (!isLoading && bufferedDurationUs < 500000) {
        Log.w(
          "DefaultLoadControl",
          "Target buffer size reached with less than 500ms of buffered media data."
        )
      }
    } else if (bufferedDurationUs >= maxBufferUs || targetBufferSizeReached) {
      isLoading = false
    } // Else don't change the loading state.

    return isLoading
  }

  override fun shouldStartPlayback(
    timeline: Timeline,
    mediaPeriodId: MediaSource.MediaPeriodId,
    bufferedDurationUs: Long,
    playbackSpeed: Float,
    rebuffering: Boolean,
    targetLiveOffsetUs: Long
  ): Boolean {
    var bufferedDurationUs = bufferedDurationUs
    bufferedDurationUs = Util.getPlayoutDurationForMediaDuration(bufferedDurationUs, playbackSpeed)
    var minBufferDurationUs = if (rebuffering) bufferForPlaybackAfterRebufferUs else bufferForPlaybackUs
    if (targetLiveOffsetUs != C.TIME_UNSET) {
      minBufferDurationUs = min((targetLiveOffsetUs / 2).toDouble(), minBufferDurationUs.toDouble()).toLong()
    }
    return minBufferDurationUs <= 0 || bufferedDurationUs >= minBufferDurationUs || (
      !prioritizeTimeOverSizeThresholds &&
        allocator.totalBytesAllocated >= targetBufferBytes
      )
  }

  /**
   * Calculate target buffer size in bytes based on the selected tracks. The player will try not to
   * exceed this target buffer. Only used when `targetBufferBytes` is [C.LENGTH_UNSET].
   *
   * @param renderers The renderers for which the track were selected.
   * @param trackSelectionArray The selected tracks.
   * @return The target buffer size in bytes.
   */
  protected fun calculateTargetBufferBytes(
    renderers: Array<Renderer>,
    trackSelectionArray: Array<ExoTrackSelection>
  ): Int {
    var targetBufferSize = 0
    for (i in renderers.indices) {
      if (trackSelectionArray[i] != null) {
        targetBufferSize += getDefaultBufferSize(renderers[i].trackType)
      }
    }
    return max(DEFAULT_MIN_BUFFER_SIZE.toDouble(), targetBufferSize.toDouble()).toInt()
  }

  private fun reset(resetAllocator: Boolean) {
    targetBufferBytes =
      if (targetBufferBytesOverwrite == C.LENGTH_UNSET
      ) {
        DEFAULT_MIN_BUFFER_SIZE
      } else {
        targetBufferBytesOverwrite
      }
    isLoading = false
    if (resetAllocator) {
      allocator.reset()
    }
  }

  companion object {
    /**
     * The default minimum duration of media that the player will attempt to ensure is buffered at all
     * times, in milliseconds.
     */
    const val DEFAULT_MIN_BUFFER_MS: Int = 25000

    /**
     * The default maximum duration of media that the player will attempt to buffer, in milliseconds.
     */
    const val DEFAULT_MAX_BUFFER_MS: Int = 25000

    /**
     * The default duration of media that must be buffered for playback to start or resume following a
     * user action such as a seek, in milliseconds.
     */
    const val DEFAULT_BUFFER_FOR_PLAYBACK_MS: Int = 2000

    /**
     * The default duration of media that must be buffered for playback to resume after a rebuffer, in
     * milliseconds. A rebuffer is defined to be caused by buffer depletion rather than a user action.
     */
    const val DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS: Int = 2000

    /**
     * The default target buffer size in bytes. The value ([C.LENGTH_UNSET]) means that the load
     * control will calculate the target buffer size based on the selected tracks.
     */
    const val DEFAULT_TARGET_BUFFER_BYTES: Int = C.LENGTH_UNSET

    /** The default prioritization of buffer time constraints over size constraints.  */
    const val DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS: Boolean = false

    /** The default back buffer duration in milliseconds.  */
    const val DEFAULT_BACK_BUFFER_DURATION_MS: Int = 0

    /** The default for whether the back buffer is retained from the previous keyframe.  */
    const val DEFAULT_RETAIN_BACK_BUFFER_FROM_KEYFRAME: Boolean = false

    /** A default size in bytes for a video buffer.  */
    const val DEFAULT_VIDEO_BUFFER_SIZE: Int = 2000 * C.DEFAULT_BUFFER_SEGMENT_SIZE

    /** A default size in bytes for an audio buffer.  */
    const val DEFAULT_AUDIO_BUFFER_SIZE: Int = 200 * C.DEFAULT_BUFFER_SEGMENT_SIZE

    /** A default size in bytes for a text buffer.  */
    const val DEFAULT_TEXT_BUFFER_SIZE: Int = 2 * C.DEFAULT_BUFFER_SEGMENT_SIZE

    /** A default size in bytes for a metadata buffer.  */
    const val DEFAULT_METADATA_BUFFER_SIZE: Int = 2 * C.DEFAULT_BUFFER_SEGMENT_SIZE

    /** A default size in bytes for a camera motion buffer.  */
    const val DEFAULT_CAMERA_MOTION_BUFFER_SIZE: Int = 2 * C.DEFAULT_BUFFER_SEGMENT_SIZE

    /** A default size in bytes for an image buffer.  */
    const val DEFAULT_IMAGE_BUFFER_SIZE: Int = 2 * C.DEFAULT_BUFFER_SEGMENT_SIZE

    /** A default size in bytes for a muxed buffer (e.g. containing video, audio and text).  */
    val DEFAULT_MUXED_BUFFER_SIZE: Int = VideoPlayerLoadControl.DEFAULT_VIDEO_BUFFER_SIZE + VideoPlayerLoadControl.DEFAULT_AUDIO_BUFFER_SIZE + VideoPlayerLoadControl.DEFAULT_TEXT_BUFFER_SIZE

    /**
     * The buffer size in bytes that will be used as a minimum target buffer in all cases. This is
     * also the default target buffer before tracks are selected.
     */
    const val DEFAULT_MIN_BUFFER_SIZE: Int = 200 * C.DEFAULT_BUFFER_SEGMENT_SIZE

    private fun getDefaultBufferSize(trackType: @C.TrackType Int): Int {
      return when (trackType) {
        C.TRACK_TYPE_DEFAULT -> DEFAULT_MUXED_BUFFER_SIZE
        C.TRACK_TYPE_AUDIO -> DEFAULT_AUDIO_BUFFER_SIZE
        C.TRACK_TYPE_VIDEO -> DEFAULT_VIDEO_BUFFER_SIZE
        C.TRACK_TYPE_TEXT -> DEFAULT_TEXT_BUFFER_SIZE
        C.TRACK_TYPE_METADATA -> DEFAULT_METADATA_BUFFER_SIZE
        C.TRACK_TYPE_CAMERA_MOTION -> DEFAULT_CAMERA_MOTION_BUFFER_SIZE
        C.TRACK_TYPE_IMAGE -> DEFAULT_IMAGE_BUFFER_SIZE
        C.TRACK_TYPE_NONE -> 0
        C.TRACK_TYPE_UNKNOWN -> throw IllegalArgumentException()
        else -> throw IllegalArgumentException()
      }
    }

    private fun assertGreaterOrEqual(value1: Int, value2: Int, name1: String, name2: String) {
      Assertions.checkArgument(value1 >= value2, "$name1 cannot be less than $name2")
    }
  }
}
