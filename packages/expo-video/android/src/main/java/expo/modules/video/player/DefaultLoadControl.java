/*
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * NOTE FROM EXPO (@behenate): 
 * This is a copy of the DefaultLoadControl from ExoPlayer. The only difference being, that the buffer options such as
 *   long minBufferUs;
 *   long maxBufferUs;rSizeThresholds
 *   long bufferForPlaybackUs;Ms
 *   long bufferForPlaybackAfterRebufferUs;AfterRebufferMs
 *   int targetBufferBytesOverwrite;
 *   and some others
 *
 * Are protected, instead of private, so that we can inherit from it and modify those at runtime
 * also the  PlayerLoadingState is made internal
 *
 * STEPS FOR UPDATING TO A NEWER VERSION:
 * - Copy the implementation for the new version from the media3 repo
 * - Make the following variables protected in DefaultLoadControl class (not the builder!):
 *     long minBufferUs;
 *     long maxBufferUs;
 *     long bufferForPlaybackUs;
 *     long bufferForPlaybackAfterRebufferUs;
 *     int targetBufferBytesOverwrite;
 *     boolean prioritizeTimeOverSizeThresholds;
 *     long backBufferDurationUs;
 *     final HashMap<PlayerId, PlayerLoadingState> loadingStates;
 * - Make PlayerLoadingState class protected instead of private
 * - Make the updateAllocator method protected
 * - Remove non-exported annotations from google
 * - In our class inheriting from DefaultLoadControl make sure that `applyBufferOptions` still does everything necessary to update the buffer preferences
 */

package expo.modules.video.player;

import static androidx.media3.common.util.Assertions.checkNotNull;
import static androidx.media3.common.util.Assertions.checkState;
import static java.lang.Math.max;
import static java.lang.Math.min;

import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;
import androidx.media3.common.C;
import androidx.media3.common.Timeline;
import androidx.media3.common.util.Assertions;
import androidx.media3.common.util.Log;
import androidx.media3.common.util.NullableType;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.common.util.Util;
import androidx.media3.exoplayer.Renderer;
import androidx.media3.exoplayer.analytics.PlayerId;
import androidx.media3.exoplayer.source.MediaSource.MediaPeriodId;
import androidx.media3.exoplayer.source.TrackGroupArray;
import androidx.media3.exoplayer.trackselection.ExoTrackSelection;
import androidx.media3.exoplayer.upstream.Allocator;
import androidx.media3.exoplayer.upstream.DefaultAllocator;
import androidx.media3.exoplayer.LoadControl;
import java.util.HashMap;

/** The default {@link LoadControl} implementation. */
@UnstableApi
public class DefaultLoadControl implements LoadControl {

  /**
   * The default minimum duration of media that the player will attempt to ensure is buffered at all
   * times, in milliseconds.
   */
  public static final int DEFAULT_MIN_BUFFER_MS = 50_000;

  /**
   * The default maximum duration of media that the player will attempt to buffer, in milliseconds.
   */
  public static final int DEFAULT_MAX_BUFFER_MS = 50_000;

  /**
   * The default duration of media that must be buffered for playback to start or resume following a
   * user action such as a seek, in milliseconds.
   */
  public static final int DEFAULT_BUFFER_FOR_PLAYBACK_MS = 1000;

  /**
   * The default duration of media that must be buffered for playback to resume after a rebuffer, in
   * milliseconds. A rebuffer is defined to be caused by buffer depletion rather than a user action.
   */
  public static final int DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS = 2000;

  /**
   * The default target buffer size in bytes. The value ({@link C#LENGTH_UNSET}) means that the load
   * control will calculate the target buffer size based on the selected tracks.
   */
  public static final int DEFAULT_TARGET_BUFFER_BYTES = C.LENGTH_UNSET;

  /** The default prioritization of buffer time constraints over size constraints. */
  public static final boolean DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS = false;

  /** The default back buffer duration in milliseconds. */
  public static final int DEFAULT_BACK_BUFFER_DURATION_MS = 0;

  /** The default for whether the back buffer is retained from the previous keyframe. */
  public static final boolean DEFAULT_RETAIN_BACK_BUFFER_FROM_KEYFRAME = false;

  /** A default size in bytes for a video buffer. */
  public static final int DEFAULT_VIDEO_BUFFER_SIZE = 2000 * C.DEFAULT_BUFFER_SEGMENT_SIZE;

  /** A default size in bytes for an audio buffer. */
  public static final int DEFAULT_AUDIO_BUFFER_SIZE = 200 * C.DEFAULT_BUFFER_SEGMENT_SIZE;

  /** A default size in bytes for a text buffer. */
  public static final int DEFAULT_TEXT_BUFFER_SIZE = 2 * C.DEFAULT_BUFFER_SEGMENT_SIZE;

  /** A default size in bytes for a metadata buffer. */
  public static final int DEFAULT_METADATA_BUFFER_SIZE = 2 * C.DEFAULT_BUFFER_SEGMENT_SIZE;

  /** A default size in bytes for a camera motion buffer. */
  public static final int DEFAULT_CAMERA_MOTION_BUFFER_SIZE = 2 * C.DEFAULT_BUFFER_SEGMENT_SIZE;

  /** A default size in bytes for an image buffer. */
  public static final int DEFAULT_IMAGE_BUFFER_SIZE = 400 * C.DEFAULT_BUFFER_SEGMENT_SIZE;

  /** A default size in bytes for a muxed buffer (e.g. containing video, audio and text). */
  public static final int DEFAULT_MUXED_BUFFER_SIZE =
    DEFAULT_VIDEO_BUFFER_SIZE + DEFAULT_AUDIO_BUFFER_SIZE + DEFAULT_TEXT_BUFFER_SIZE;

  /**
   * The buffer size in bytes that will be used as a minimum target buffer in all cases. This is
   * also the default target buffer before tracks are selected.
   */
  public static final int DEFAULT_MIN_BUFFER_SIZE = 200 * C.DEFAULT_BUFFER_SEGMENT_SIZE;

  /** Builder for {@link DefaultLoadControl}. */
  public static final class Builder {

    @Nullable private DefaultAllocator allocator;
    private int minBufferMs;
    private int maxBufferMs;
    private int bufferForPlaybackMs;
    private int bufferForPlaybackAfterRebufferMs;
    private int targetBufferBytes;
    private boolean prioritizeTimeOverSizeThresholds;
    private int backBufferDurationMs;
    private boolean retainBackBufferFromKeyframe;
    private boolean buildCalled;

    /** Constructs a new instance. */
    public Builder() {
      minBufferMs = DEFAULT_MIN_BUFFER_MS;
      maxBufferMs = DEFAULT_MAX_BUFFER_MS;
      bufferForPlaybackMs = DEFAULT_BUFFER_FOR_PLAYBACK_MS;
      bufferForPlaybackAfterRebufferMs = DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS;
      targetBufferBytes = DEFAULT_TARGET_BUFFER_BYTES;
      prioritizeTimeOverSizeThresholds = DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS;
      backBufferDurationMs = DEFAULT_BACK_BUFFER_DURATION_MS;
      retainBackBufferFromKeyframe = DEFAULT_RETAIN_BACK_BUFFER_FROM_KEYFRAME;
    }

    /**
     * Sets the {@link DefaultAllocator} used by the loader.
     *
     * @param allocator The {@link DefaultAllocator}.
     * @return This builder, for convenience.
     * @throws IllegalStateException If {@link #build()} has already been called.
     */
    public Builder setAllocator(DefaultAllocator allocator) {
      checkState(!buildCalled);
      this.allocator = allocator;
      return this;
    }

    /**
     * Sets the buffer duration parameters.
     *
     * @param minBufferMs The minimum duration of media that the player will attempt to ensure is
     *     buffered at all times, in milliseconds.
     * @param maxBufferMs The maximum duration of media that the player will attempt to buffer, in
     *     milliseconds.
     * @param bufferForPlaybackMs The duration of media that must be buffered for playback to start
     *     or resume following a user action such as a seek, in milliseconds.
     * @param bufferForPlaybackAfterRebufferMs The default duration of media that must be buffered
     *     for playback to resume after a rebuffer, in milliseconds. A rebuffer is defined to be
     *     caused by buffer depletion rather than a user action.
     * @return This builder, for convenience.
     * @throws IllegalStateException If {@link #build()} has already been called.
     */
    public Builder setBufferDurationsMs(
      int minBufferMs,
      int maxBufferMs,
      int bufferForPlaybackMs,
      int bufferForPlaybackAfterRebufferMs) {
      checkState(!buildCalled);
      assertGreaterOrEqual(bufferForPlaybackMs, 0, "bufferForPlaybackMs", "0");
      assertGreaterOrEqual(
        bufferForPlaybackAfterRebufferMs, 0, "bufferForPlaybackAfterRebufferMs", "0");
      assertGreaterOrEqual(minBufferMs, bufferForPlaybackMs, "minBufferMs", "bufferForPlaybackMs");
      assertGreaterOrEqual(
        minBufferMs,
        bufferForPlaybackAfterRebufferMs,
        "minBufferMs",
        "bufferForPlaybackAfterRebufferMs");
      assertGreaterOrEqual(maxBufferMs, minBufferMs, "maxBufferMs", "minBufferMs");
      this.minBufferMs = minBufferMs;
      this.maxBufferMs = maxBufferMs;
      this.bufferForPlaybackMs = bufferForPlaybackMs;
      this.bufferForPlaybackAfterRebufferMs = bufferForPlaybackAfterRebufferMs;
      return this;
    }

    /**
     * Sets the target buffer size in bytes for each player. The actual overall target buffer size
     * is this value multiplied by the number of players that use the load control simultaneously.
     * If set to {@link C#LENGTH_UNSET}, the target buffer size of a player will be calculated based
     * on the selected tracks of the player.
     *
     * @param targetBufferBytes The target buffer size in bytes.
     * @return This builder, for convenience.
     * @throws IllegalStateException If {@link #build()} has already been called.
     */
    public Builder setTargetBufferBytes(int targetBufferBytes) {
      checkState(!buildCalled);
      this.targetBufferBytes = targetBufferBytes;
      return this;
    }

    /**
     * Sets whether the load control prioritizes buffer time constraints over buffer size
     * constraints.
     *
     * @param prioritizeTimeOverSizeThresholds Whether the load control prioritizes buffer time
     *     constraints over buffer size constraints.
     * @return This builder, for convenience.
     * @throws IllegalStateException If {@link #build()} has already been called.
     */
    public Builder setPrioritizeTimeOverSizeThresholds(boolean prioritizeTimeOverSizeThresholds) {
      checkState(!buildCalled);
      this.prioritizeTimeOverSizeThresholds = prioritizeTimeOverSizeThresholds;
      return this;
    }

    /**
     * Sets the back buffer duration, and whether the back buffer is retained from the previous
     * keyframe.
     *
     * @param backBufferDurationMs The back buffer duration in milliseconds.
     * @param retainBackBufferFromKeyframe Whether the back buffer is retained from the previous
     *     keyframe.
     * @return This builder, for convenience.
     * @throws IllegalStateException If {@link #build()} has already been called.
     */
    public Builder setBackBuffer(int backBufferDurationMs, boolean retainBackBufferFromKeyframe) {
      checkState(!buildCalled);
      assertGreaterOrEqual(backBufferDurationMs, 0, "backBufferDurationMs", "0");
      this.backBufferDurationMs = backBufferDurationMs;
      this.retainBackBufferFromKeyframe = retainBackBufferFromKeyframe;
      return this;
    }

    /** Creates a {@link DefaultLoadControl}. */
    public DefaultLoadControl build() {
      checkState(!buildCalled);
      buildCalled = true;
      if (allocator == null) {
        allocator = new DefaultAllocator(/* trimOnReset= */ true, C.DEFAULT_BUFFER_SEGMENT_SIZE);
      }
      return new DefaultLoadControl(
        allocator,
        minBufferMs,
        maxBufferMs,
        bufferForPlaybackMs,
        bufferForPlaybackAfterRebufferMs,
        targetBufferBytes,
        prioritizeTimeOverSizeThresholds,
        backBufferDurationMs,
        retainBackBufferFromKeyframe);
    }
  }

  private final DefaultAllocator allocator;

  protected long minBufferUs;
  protected long maxBufferUs;
  protected long bufferForPlaybackUs;
  protected long bufferForPlaybackAfterRebufferUs;
  protected int targetBufferBytesOverwrite;
  protected boolean prioritizeTimeOverSizeThresholds;
  protected long backBufferDurationUs;
  private final boolean retainBackBufferFromKeyframe;
  protected final HashMap<PlayerId, PlayerLoadingState> loadingStates;

  private long threadId;

  /** Constructs a new instance, using the {@code DEFAULT_*} constants defined in this class. */
  public DefaultLoadControl() {
    this(
      new DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE),
      DEFAULT_MIN_BUFFER_MS,
      DEFAULT_MAX_BUFFER_MS,
      DEFAULT_BUFFER_FOR_PLAYBACK_MS,
      DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS,
      DEFAULT_TARGET_BUFFER_BYTES,
      DEFAULT_PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS,
      DEFAULT_BACK_BUFFER_DURATION_MS,
      DEFAULT_RETAIN_BACK_BUFFER_FROM_KEYFRAME);
  }

  protected DefaultLoadControl(
    DefaultAllocator allocator,
    int minBufferMs,
    int maxBufferMs,
    int bufferForPlaybackMs,
    int bufferForPlaybackAfterRebufferMs,
    int targetBufferBytes,
    boolean prioritizeTimeOverSizeThresholds,
    int backBufferDurationMs,
    boolean retainBackBufferFromKeyframe) {
    assertGreaterOrEqual(bufferForPlaybackMs, 0, "bufferForPlaybackMs", "0");
    assertGreaterOrEqual(
      bufferForPlaybackAfterRebufferMs, 0, "bufferForPlaybackAfterRebufferMs", "0");
    assertGreaterOrEqual(minBufferMs, bufferForPlaybackMs, "minBufferMs", "bufferForPlaybackMs");
    assertGreaterOrEqual(
      minBufferMs,
      bufferForPlaybackAfterRebufferMs,
      "minBufferMs",
      "bufferForPlaybackAfterRebufferMs");
    assertGreaterOrEqual(maxBufferMs, minBufferMs, "maxBufferMs", "minBufferMs");
    assertGreaterOrEqual(backBufferDurationMs, 0, "backBufferDurationMs", "0");

    this.allocator = allocator;
    this.minBufferUs = Util.msToUs(minBufferMs);
    this.maxBufferUs = Util.msToUs(maxBufferMs);
    this.bufferForPlaybackUs = Util.msToUs(bufferForPlaybackMs);
    this.bufferForPlaybackAfterRebufferUs = Util.msToUs(bufferForPlaybackAfterRebufferMs);
    this.targetBufferBytesOverwrite = targetBufferBytes;
    this.prioritizeTimeOverSizeThresholds = prioritizeTimeOverSizeThresholds;
    this.backBufferDurationUs = Util.msToUs(backBufferDurationMs);
    this.retainBackBufferFromKeyframe = retainBackBufferFromKeyframe;
    loadingStates = new HashMap<>();
    threadId = C.INDEX_UNSET;
  }

  @Override
  public void onPrepared(PlayerId playerId) {
    long currentThreadId = Thread.currentThread().getId();
    checkState(
      threadId == C.INDEX_UNSET || threadId == currentThreadId,
      "Players that share the same LoadControl must share the same playback thread. See"
        + " ExoPlayer.Builder.setPlaybackLooper(Looper).");
    threadId = currentThreadId;
    if (!loadingStates.containsKey(playerId)) {
      loadingStates.put(playerId, new PlayerLoadingState());
    }
    resetPlayerLoadingState(playerId);
  }

  @Override
  public void onTracksSelected(
    LoadControl.Parameters parameters,
    TrackGroupArray trackGroups,
    @NullableType ExoTrackSelection[] trackSelections) {
    checkNotNull(loadingStates.get(parameters.playerId)).targetBufferBytes =
      targetBufferBytesOverwrite == C.LENGTH_UNSET
        ? calculateTargetBufferBytes(trackSelections)
        : targetBufferBytesOverwrite;
    updateAllocator();
  }

  @Override
  public void onStopped(PlayerId playerId) {
    removePlayer(playerId);
  }

  @Override
  public void onReleased(PlayerId playerId) {
    removePlayer(playerId);
    if (loadingStates.isEmpty()) {
      threadId = C.INDEX_UNSET;
    }
  }

  @Override
  public Allocator getAllocator() {
    return allocator;
  }

  @Override
  public long getBackBufferDurationUs(PlayerId playerId) {
    return backBufferDurationUs;
  }

  @Override
  public boolean retainBackBufferFromKeyframe(PlayerId playerId) {
    return retainBackBufferFromKeyframe;
  }

  @Override
  public boolean shouldContinueLoading(Parameters parameters) {
    PlayerLoadingState playerLoadingState = checkNotNull(loadingStates.get(parameters.playerId));
    boolean targetBufferSizeReached =
      allocator.getTotalBytesAllocated() >= calculateTotalTargetBufferBytes();
    long minBufferUs = this.minBufferUs;
    if (parameters.playbackSpeed > 1) {
      // The playback speed is faster than real time, so scale up the minimum required media
      // duration to keep enough media buffered for a playout duration of minBufferUs.
      long mediaDurationMinBufferUs =
        Util.getMediaDurationForPlayoutDuration(minBufferUs, parameters.playbackSpeed);
      minBufferUs = min(mediaDurationMinBufferUs, maxBufferUs);
    }
    // Prevent playback from getting stuck if minBufferUs is too small.
    minBufferUs = max(minBufferUs, 500_000);
    if (parameters.bufferedDurationUs < minBufferUs) {
      playerLoadingState.isLoading = prioritizeTimeOverSizeThresholds || !targetBufferSizeReached;
      if (!playerLoadingState.isLoading && parameters.bufferedDurationUs < 500_000) {
        Log.w(
          "DefaultLoadControl",
          "Target buffer size reached with less than 500ms of buffered media data.");
      }
    } else if (parameters.bufferedDurationUs >= maxBufferUs || targetBufferSizeReached) {
      playerLoadingState.isLoading = false;
    } // Else don't change the loading state.
    return playerLoadingState.isLoading;
  }

  @Override
  public boolean shouldStartPlayback(Parameters parameters) {
    long bufferedDurationUs =
      Util.getPlayoutDurationForMediaDuration(
        parameters.bufferedDurationUs, parameters.playbackSpeed);
    long minBufferDurationUs =
      parameters.rebuffering ? bufferForPlaybackAfterRebufferUs : bufferForPlaybackUs;
    if (parameters.targetLiveOffsetUs != C.TIME_UNSET) {
      minBufferDurationUs = min(parameters.targetLiveOffsetUs / 2, minBufferDurationUs);
    }
    return minBufferDurationUs <= 0
      || bufferedDurationUs >= minBufferDurationUs
      || (!prioritizeTimeOverSizeThresholds
      && allocator.getTotalBytesAllocated() >= calculateTotalTargetBufferBytes());
  }

  @Override
  public boolean shouldContinuePreloading(
    Timeline timeline, MediaPeriodId mediaPeriodId, long bufferedDurationUs) {
    for (PlayerLoadingState playerLoadingState : loadingStates.values()) {
      if (playerLoadingState.isLoading) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate target buffer size in bytes based on the selected tracks. The player will try not to
   * exceed this target buffer. Only used when {@code targetBufferBytes} is {@link C#LENGTH_UNSET}.
   *
   * @param trackSelectionArray The selected tracks.
   * @return The target buffer size in bytes.
   */
  protected int calculateTargetBufferBytes(@NullableType ExoTrackSelection[] trackSelectionArray) {
    int targetBufferSize = 0;
    for (ExoTrackSelection exoTrackSelection : trackSelectionArray) {
      if (exoTrackSelection != null) {
        targetBufferSize += getDefaultBufferSize(exoTrackSelection.getTrackGroup().type);
      }
    }
    return max(DEFAULT_MIN_BUFFER_SIZE, targetBufferSize);
  }

  /**
   * @deprecated Use {@link #calculateTargetBufferBytes(ExoTrackSelection[])} instead.
   */
  @Deprecated
  protected final int calculateTargetBufferBytes(
    Renderer[] renderers, ExoTrackSelection[] trackSelectionArray) {
    return calculateTargetBufferBytes(trackSelectionArray);
  }

  @VisibleForTesting
    /* package */ int calculateTotalTargetBufferBytes() {
    int totalTargetBufferBytes = 0;
    for (PlayerLoadingState state : loadingStates.values()) {
      totalTargetBufferBytes += state.targetBufferBytes;
    }
    return totalTargetBufferBytes;
  }

  private void resetPlayerLoadingState(PlayerId playerId) {
    PlayerLoadingState playerLoadingState = checkNotNull(loadingStates.get(playerId));
    playerLoadingState.targetBufferBytes =
      targetBufferBytesOverwrite == C.LENGTH_UNSET
        ? DEFAULT_MIN_BUFFER_SIZE
        : targetBufferBytesOverwrite;
    playerLoadingState.isLoading = false;
  }

  private void removePlayer(PlayerId playerId) {
    if (loadingStates.remove(playerId) != null) {
      updateAllocator();
    }
  }

  protected void updateAllocator() {
    if (loadingStates.isEmpty()) {
      allocator.reset();
    } else {
      allocator.setTargetBufferSize(calculateTotalTargetBufferBytes());
    }
  }

  private static int getDefaultBufferSize(@C.TrackType int trackType) {
    switch (trackType) {
      case C.TRACK_TYPE_DEFAULT:
        return DEFAULT_MUXED_BUFFER_SIZE;
      case C.TRACK_TYPE_AUDIO:
        return DEFAULT_AUDIO_BUFFER_SIZE;
      case C.TRACK_TYPE_VIDEO:
        return DEFAULT_VIDEO_BUFFER_SIZE;
      case C.TRACK_TYPE_TEXT:
        return DEFAULT_TEXT_BUFFER_SIZE;
      case C.TRACK_TYPE_METADATA:
        return DEFAULT_METADATA_BUFFER_SIZE;
      case C.TRACK_TYPE_CAMERA_MOTION:
        return DEFAULT_CAMERA_MOTION_BUFFER_SIZE;
      case C.TRACK_TYPE_IMAGE:
        return DEFAULT_IMAGE_BUFFER_SIZE;
      case C.TRACK_TYPE_NONE:
        return 0;
      case C.TRACK_TYPE_UNKNOWN:
        return DEFAULT_MIN_BUFFER_SIZE;
      default:
        throw new IllegalArgumentException();
    }
  }

  private static void assertGreaterOrEqual(int value1, int value2, String name1, String name2) {
    Assertions.checkArgument(value1 >= value2, name1 + " cannot be less than " + name2);
  }

  protected static class PlayerLoadingState {
    public boolean isLoading;
    public int targetBufferBytes;
  }
}