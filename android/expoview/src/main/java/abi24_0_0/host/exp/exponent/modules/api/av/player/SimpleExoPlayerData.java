package abi24_0_0.host.exp.exponent.modules.api.av.player;

import android.net.Uri;
import android.os.Handler;
import android.util.Pair;
import android.view.Surface;

import abi24_0_0.com.facebook.react.bridge.ReadableMap;
import abi24_0_0.com.facebook.react.bridge.WritableMap;
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.extractor.ExtractorsFactory;
import com.google.android.exoplayer2.extractor.DefaultExtractorsFactory;
import com.google.android.exoplayer2.source.ExtractorMediaSource;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.trackselection.TrackSelector;
import com.google.android.exoplayer2.upstream.BandwidthMeter;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;
import com.google.android.exoplayer2.util.Util;

import java.io.IOException;

import abi24_0_0.host.exp.exponent.modules.api.av.AVModule;

class SimpleExoPlayerData extends PlayerData
    implements Player.EventListener, ExtractorMediaSource.EventListener, SimpleExoPlayer.VideoListener {

  private static final String IMPLEMENTATION_NAME = "SimpleExoPlayer";

  private SimpleExoPlayer mSimpleExoPlayer = null;
  private LoadCompletionListener mLoadCompletionListener = null;
  private boolean mFirstFrameRendered = false;
  private Pair<Integer, Integer> mVideoWidthHeight = null;
  private Integer mLastPlaybackState = null;
  private boolean mIsLooping = false;
  private boolean mIsLoading = true;

  SimpleExoPlayerData(final AVModule avModule, final Uri uri) {
    super(avModule, uri);
  }

  @Override
  String getImplementationName() {
    return IMPLEMENTATION_NAME;
  }

  // --------- PlayerData implementation ---------

  // Lifecycle

  @Override
  public void load(final ReadableMap status, final LoadCompletionListener loadCompletionListener) {
    mLoadCompletionListener = loadCompletionListener;

    // Create a default TrackSelector
    final Handler mainHandler = new Handler();
    // Measures bandwidth during playback. Can be null if not required.
    final BandwidthMeter bandwidthMeter = new DefaultBandwidthMeter();
    final TrackSelection.Factory videoTrackSelectionFactory = new AdaptiveTrackSelection.Factory(bandwidthMeter);
    final TrackSelector trackSelector = new DefaultTrackSelector(videoTrackSelectionFactory);

    // Create the player
    mSimpleExoPlayer = ExoPlayerFactory.newSimpleInstance(mAVModule.mScopedContext, trackSelector);
    mSimpleExoPlayer.addListener(this);
    mSimpleExoPlayer.addVideoListener(this);

    // Produces DataSource instances through which media data is loaded.
    final DataSource.Factory dataSourceFactory = new DefaultDataSourceFactory(mAVModule.mScopedContext, Util.getUserAgent(mAVModule.mScopedContext, "yourApplicationName"));
    // Produces Extractor instances for parsing the media data.
    final ExtractorsFactory extractorsFactory = new DefaultExtractorsFactory();
    // This is the MediaSource representing the media to be played.
    final MediaSource videoSource = new ExtractorMediaSource(mUri, dataSourceFactory, extractorsFactory, mainHandler, this);
    // Prepare the player with the source.
    mSimpleExoPlayer.prepare(videoSource);
    setStatus(status, null);
  }

  @Override
  public synchronized void release() {
    if (mSimpleExoPlayer != null) {
      mSimpleExoPlayer.release();
      mSimpleExoPlayer = null;
    }
  }

  @Override
  boolean shouldContinueUpdatingProgress() {
    return mSimpleExoPlayer != null && mSimpleExoPlayer.getPlayWhenReady();
  }

  // Set status

  @Override
  void playPlayerWithRateAndMuteIfNecessary() throws AVModule.AudioFocusNotAcquiredException {
    if (mSimpleExoPlayer == null || !shouldPlayerPlay()) {
      return;
    }

    if (!mIsMuted) {
      mAVModule.acquireAudioFocus();
    }

    updateVolumeMuteAndDuck();

    mSimpleExoPlayer.setPlaybackParameters(new PlaybackParameters(mRate, mShouldCorrectPitch ? 1.0f : mRate));

    mSimpleExoPlayer.setPlayWhenReady(mShouldPlay);

    beginUpdatingProgressIfNecessary();
  }

  @Override
  void applyNewStatus(final Integer newPositionMillis, final Boolean newIsLooping)
      throws AVModule.AudioFocusNotAcquiredException, IllegalStateException {
    if (mSimpleExoPlayer == null) {
      throw new IllegalStateException("mSimpleExoPlayer is null!");
    }

    // Set looping idempotently
    if (newIsLooping != null) {
      mIsLooping = newIsLooping;
      if (mIsLooping) {
        mSimpleExoPlayer.setRepeatMode(Player.REPEAT_MODE_ALL);
      } else {
        mSimpleExoPlayer.setRepeatMode(Player.REPEAT_MODE_OFF);
      }
    }

    // Pause first if necessary.
    if (!shouldPlayerPlay()) {
      mSimpleExoPlayer.setPlayWhenReady(false);
      stopUpdatingProgressIfNecessary();
    }

    // Mute / update volume if it doesn't require a request of the audio focus.
    updateVolumeMuteAndDuck();

    // Seek
    if (newPositionMillis != null) {
      // TODO handle different timeline cases for streaming
      mSimpleExoPlayer.seekTo(newPositionMillis);
    }

    // Play / unmute
    playPlayerWithRateAndMuteIfNecessary();
  }

  // Get status

  @Override
  boolean isLoaded() {
    return mSimpleExoPlayer != null;
  }

  @Override
  void getExtraStatusFields(final WritableMap map) {
    // TODO handle different timeline cases for streaming
    final int duration = (int) mSimpleExoPlayer.getDuration();
    map.putInt(STATUS_DURATION_MILLIS_KEY_PATH, duration);
    map.putInt(STATUS_POSITION_MILLIS_KEY_PATH,
        getClippedIntegerForValue((int) mSimpleExoPlayer.getCurrentPosition(), 0, duration));
    map.putInt(STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH,
        getClippedIntegerForValue((int) mSimpleExoPlayer.getBufferedPosition(), 0, duration));

    map.putBoolean(STATUS_IS_PLAYING_KEY_PATH,
        mSimpleExoPlayer.getPlaybackState() == Player.STATE_READY && mSimpleExoPlayer.getPlayWhenReady());
    map.putBoolean(STATUS_IS_BUFFERING_KEY_PATH,
        mSimpleExoPlayer.getPlaybackState() == Player.STATE_BUFFERING || mIsLoading);

    map.putBoolean(STATUS_IS_LOOPING_KEY_PATH, mIsLooping);
  }

  // Video specific stuff

  @Override
  public Pair<Integer, Integer> getVideoWidthHeight() {
    return mVideoWidthHeight != null ? mVideoWidthHeight : new Pair<>(0, 0);
  }

  @Override
  public void tryUpdateVideoSurface(final Surface surface) {
    if (mSimpleExoPlayer != null) {
      mSimpleExoPlayer.setVideoSurface(surface);
    }
  }

  @Override
  public int getAudioSessionId() {
    return mSimpleExoPlayer != null ? mSimpleExoPlayer.getAudioSessionId() : 0;
  }

  // --------- Interface implementation ---------

  // AudioEventHandler

  @Override
  public void pauseImmediately() {
    if (mSimpleExoPlayer != null) {
      mSimpleExoPlayer.setPlayWhenReady(false);
    }
    stopUpdatingProgressIfNecessary();
  }

  @Override
  public boolean requiresAudioFocus() {
    return mSimpleExoPlayer != null && (mSimpleExoPlayer.getPlayWhenReady() || shouldPlayerPlay()) && !mIsMuted;
  }

  @Override
  public void updateVolumeMuteAndDuck() {
    if (mSimpleExoPlayer != null) {
      mSimpleExoPlayer.setVolume(mAVModule.getVolumeForDuckAndFocus(mIsMuted, mVolume));
    }
  }

  // Player.EventListener

  @Override
  public void onLoadingChanged(final boolean isLoading) {
    if (!isLoading && mLoadCompletionListener != null) {
      final LoadCompletionListener listener = mLoadCompletionListener;
      mLoadCompletionListener = null;
      listener.onLoadSuccess(getStatus());
    }
    mIsLoading = isLoading;
    callStatusUpdateListener();
  }

  @Override
  public void onPlaybackParametersChanged(PlaybackParameters parameters) {
  }

  @Override
  public void onSeekProcessed() {

  }

  @Override
  public void onRepeatModeChanged(int repeatMode) {
  }

  @Override
  public void onShuffleModeEnabledChanged(boolean shuffleModeEnabled) {

  }

  @Override
  public void onTracksChanged(TrackGroupArray trackGroups,
                              TrackSelectionArray trackSelections) {

  }

  @Override
  public void onPlayerStateChanged(final boolean playWhenReady, final int playbackState) {
    if (mLastPlaybackState != null
        && playbackState != mLastPlaybackState
        && playbackState == Player.STATE_ENDED) {
      callStatusUpdateListenerWithDidJustFinish();
    } else {
      callStatusUpdateListener();
    }
    mLastPlaybackState = playbackState;
  }

  @Override
  public void onTimelineChanged(final Timeline timeline, final Object manifest) {

  }

  @Override
  public void onPlayerError(final ExoPlaybackException error) {
    mErrorListener.onError("Player error: " + error.getMessage());
  }

  @Override
  public void onPositionDiscontinuity(int reason) {

  }


  // ExtractorMediaSource.EventListener

  @Override
  public void onLoadError(final IOException error) {
    if (mLoadCompletionListener != null) {
      final LoadCompletionListener listener = mLoadCompletionListener;
      mLoadCompletionListener = null;
      listener.onLoadError(error.toString());
    }
    release();
  }

  // SimpleExoPlayer.VideoListener

  @Override
  public void onVideoSizeChanged(final int width, final int height, final int unappliedRotationDegrees, final float pixelWidthHeightRatio) {
    // TODO other params?
    mVideoWidthHeight = new Pair<>(width, height);
    if (mFirstFrameRendered && mVideoSizeUpdateListener != null) {
      mVideoSizeUpdateListener.onVideoSizeUpdate(mVideoWidthHeight);
    }
  }

  @Override
  public void onRenderedFirstFrame() {
    if (!mFirstFrameRendered && mVideoWidthHeight != null && mVideoSizeUpdateListener != null) {
      mVideoSizeUpdateListener.onVideoSizeUpdate(mVideoWidthHeight);
    }
    mFirstFrameRendered = true;
  }
}
