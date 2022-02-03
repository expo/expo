package expo.modules.av.player;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;

import androidx.annotation.Nullable;

import android.text.TextUtils;
import android.util.Log;
import android.util.Pair;
import android.view.Surface;

import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.DefaultLoadControl;
import com.google.android.exoplayer2.DefaultRenderersFactory;
import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.extractor.DefaultExtractorsFactory;
import com.google.android.exoplayer2.source.AdaptiveMediaSourceEventListener;
import com.google.android.exoplayer2.source.ExtractorMediaSource;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.source.dash.DashMediaSource;
import com.google.android.exoplayer2.source.dash.DefaultDashChunkSource;
import com.google.android.exoplayer2.source.hls.HlsMediaSource;
import com.google.android.exoplayer2.source.smoothstreaming.DefaultSsChunkSource;
import com.google.android.exoplayer2.source.smoothstreaming.SsMediaSource;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.trackselection.TrackSelector;
import com.google.android.exoplayer2.upstream.BandwidthMeter;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.RawResourceDataSource;
import com.google.android.exoplayer2.util.Util;

import java.io.IOException;
import java.util.Map;

import expo.modules.av.AVManagerInterface;
import expo.modules.av.AudioFocusNotAcquiredException;
import expo.modules.av.player.datasource.CustomHeadersOkHttpDataSourceFactory;
import expo.modules.av.player.datasource.DataSourceFactoryProvider;

class SimpleExoPlayerData extends PlayerData
  implements Player.EventListener, ExtractorMediaSource.EventListener, SimpleExoPlayer.VideoListener, AdaptiveMediaSourceEventListener {

  private static final String IMPLEMENTATION_NAME = "SimpleExoPlayer";
  private static final String TAG = SimpleExoPlayerData.class.getSimpleName();

  private SimpleExoPlayer mSimpleExoPlayer = null;
  private String mOverridingExtension;
  private LoadCompletionListener mLoadCompletionListener = null;
  private boolean mFirstFrameRendered = false;
  private Pair<Integer, Integer> mVideoWidthHeight = null;
  private Integer mLastPlaybackState = null;
  private boolean mIsLooping = false;
  private boolean mIsLoading = true;
  private Context mReactContext;

  SimpleExoPlayerData(final AVManagerInterface avModule, final Context context, final Uri uri, final String overridingExtension, final Map<String, Object> requestHeaders) {
    super(avModule, uri, requestHeaders);
    mReactContext = context;
    mOverridingExtension = overridingExtension;
  }

  @Override
  String getImplementationName() {
    return IMPLEMENTATION_NAME;
  }

  // --------- PlayerData implementation ---------

  // Lifecycle

  @Override
  public void load(final Bundle status, final LoadCompletionListener loadCompletionListener) {
    mLoadCompletionListener = loadCompletionListener;

    // Create a default TrackSelector
    final Handler mainHandler = new Handler();
    // Measures bandwidth during playback. Can be null if not required.
    final BandwidthMeter bandwidthMeter = new DefaultBandwidthMeter();
    final TrackSelection.Factory trackSelectionFactory = new AdaptiveTrackSelection.Factory();
    final TrackSelector trackSelector = new DefaultTrackSelector(trackSelectionFactory);

    // Create the player
    mSimpleExoPlayer = ExoPlayerFactory.newSimpleInstance(
      mAVModule.getContext(),
      new DefaultRenderersFactory(mAVModule.getContext()),
      trackSelector,
      new DefaultLoadControl(),
      null,
      bandwidthMeter);
    mSimpleExoPlayer.addListener(this);
    mSimpleExoPlayer.addVideoListener(this);

    // Produces DataSource instances through which media data is loaded.
    final DataSource.Factory dataSourceFactory = mAVModule.getModuleRegistry().getModule(DataSourceFactoryProvider.class).createFactory(mReactContext, mAVModule.getModuleRegistry(), Util.getUserAgent(mAVModule.getContext(), "yourApplicationName"), mRequestHeaders, bandwidthMeter.getTransferListener());
    try {
      // This is the MediaSource representing the media to be played.
      final MediaSource source = buildMediaSource(mUri, mOverridingExtension, mainHandler, dataSourceFactory);

      // Prepare the player with the source.
      mSimpleExoPlayer.prepare(source);
      setStatus(status, null);
    } catch (IllegalStateException e) {
      onFatalError(e);
    }
  }

  @Override
  public synchronized void release() {
    stopUpdatingProgressIfNecessary();
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
  void playPlayerWithRateAndMuteIfNecessary() throws AudioFocusNotAcquiredException {
    if (mSimpleExoPlayer == null || !shouldPlayerPlay()) {
      return;
    }

    if (!mIsMuted) {
      mAVModule.acquireAudioFocus();
    }

    updateVolumeMuteAndDuck();

    mSimpleExoPlayer.setPlaybackParameters(new PlaybackParameters(mRate, mShouldCorrectPitch ? 1.0f : mRate));

    mSimpleExoPlayer.setPlayWhenReady(mShouldPlay);
  }

  @Override
  void applyNewStatus(final Integer newPositionMillis, final Boolean newIsLooping)
    throws AudioFocusNotAcquiredException, IllegalStateException {
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
  void getExtraStatusFields(final Bundle map) {
    // TODO handle different timeline cases for streaming
    final int duration = (int) mSimpleExoPlayer.getDuration();
    map.putInt(STATUS_DURATION_MILLIS_KEY_PATH, duration);
    map.putInt(STATUS_POSITION_MILLIS_KEY_PATH,
      getClippedIntegerForValue((int) mSimpleExoPlayer.getCurrentPosition(), 0, duration));
    map.putInt(STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH,
      getClippedIntegerForValue((int) mSimpleExoPlayer.getBufferedPosition(), 0, duration));

    map.putBoolean(STATUS_IS_PLAYING_KEY_PATH,
      mSimpleExoPlayer.getPlayWhenReady() && mSimpleExoPlayer.getPlaybackState() == Player.STATE_READY);
    map.putBoolean(STATUS_IS_BUFFERING_KEY_PATH,
      mIsLoading || mSimpleExoPlayer.getPlaybackState() == Player.STATE_BUFFERING);

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

  // ExoPlayer.EventListener

  @Override
  public void onLoadingChanged(final boolean isLoading) {
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
    if (playbackState == Player.STATE_READY && mLoadCompletionListener != null) {
      final LoadCompletionListener listener = mLoadCompletionListener;
      mLoadCompletionListener = null;
      listener.onLoadSuccess(getStatus());
    }

    if (mLastPlaybackState != null
      && playbackState != mLastPlaybackState
      && playbackState == Player.STATE_ENDED) {
      callStatusUpdateListenerWithDidJustFinish();
      stopUpdatingProgressIfNecessary();
    } else {
      callStatusUpdateListener();
      if (playWhenReady && (playbackState == Player.STATE_READY)) {
        beginUpdatingProgressIfNecessary();
      }
    }
    mLastPlaybackState = playbackState;
  }

  @Override
  public void onPlayerError(final ExoPlaybackException error) {
    onFatalError(error.getCause());
  }

  @Override
  public void onPositionDiscontinuity(int reason) {
    // According to the documentation:
    // > A period defines a single logical piece of media, for example a media file.
    // > It may also define groups of ads inserted into the media,
    // > along with information about whether those ads have been loaded and played.
    // Source: https://google.github.io/ExoPlayer/doc/reference/com/google/android/exoplayer2/Timeline.Period.html
    // So I guess it's safe to say that when a period transition happens,
    // media file transition happens, so we just finished playing one.
    if (reason == Player.DISCONTINUITY_REASON_PERIOD_TRANSITION) {
      callStatusUpdateListenerWithDidJustFinish();
    }
  }


  // ExtractorMediaSource.EventListener

  @Override
  public void onLoadError(final IOException error) {
    if (mLoadCompletionListener != null) {
      final LoadCompletionListener listener = mLoadCompletionListener;
      mLoadCompletionListener = null;
      listener.onLoadError(error.toString());
    }
  }

  private void onFatalError(final Throwable error) {
    if (mLoadCompletionListener != null) {
      final LoadCompletionListener listener = mLoadCompletionListener;
      mLoadCompletionListener = null;
      listener.onLoadError(error.toString());
    } else if (mErrorListener != null) {
      mErrorListener.onError("Player error: " + error.getMessage());
    }
    release();
  }

  // SimpleExoPlayer.VideoListener

  @Override
  public void onVideoSizeChanged(final int width, final int height, final int unAppliedRotationDegrees, final float pixelWidthHeightRatio) {
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

  // https://github.com/google/ExoPlayer/blob/2b20780482a9c6b07416bcbf4de829532859d10a/demos/main/src/main/java/com/google/android/exoplayer2/demo/PlayerActivity.java#L365-L393
  private MediaSource buildMediaSource(Uri uri, String overrideExtension, Handler mainHandler, DataSource.Factory factory) {
    try {
      if (uri.getScheme() == null) {
        int resourceId = mReactContext.getResources().getIdentifier(uri.toString(), "raw", mReactContext.getPackageName());
        DataSpec dataSpec = new DataSpec(RawResourceDataSource.buildRawResourceUri(resourceId));
        final RawResourceDataSource rawResourceDataSource = new RawResourceDataSource(mReactContext);
        rawResourceDataSource.open(dataSpec);
        uri = rawResourceDataSource.getUri();
      }
    } catch (Exception e) {
      Log.e(TAG, "Error reading raw resource from ExoPlayer", e);
    }
    @C.ContentType int type = TextUtils.isEmpty(overrideExtension) ? Util.inferContentType(String.valueOf(uri)) : Util.inferContentType("." + overrideExtension);
    switch (type) {
      case C.TYPE_SS:
        return new SsMediaSource(uri, factory,
          new DefaultSsChunkSource.Factory(factory), mainHandler, this);
      case C.TYPE_DASH:
        return new DashMediaSource(uri, factory,
          new DefaultDashChunkSource.Factory(factory), mainHandler, this);
      case C.TYPE_HLS:
        return new HlsMediaSource(uri, factory, mainHandler, this);
      case C.TYPE_OTHER:
        return new ExtractorMediaSource(uri, factory, new DefaultExtractorsFactory(), mainHandler, this);
      default: {
        throw new IllegalStateException("Content of this type is unsupported at the moment. Unsupported type: " + type);
      }
    }
  }

  // AdaptiveMediaSourceEventListener
  @Override
  public void onMediaPeriodCreated(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId) {

  }

  @Override
  public void onMediaPeriodReleased(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId) {

  }

  @Override
  public void onLoadStarted(int windowIndex, @Nullable MediaSource.MediaPeriodId mediaPeriodId, LoadEventInfo loadEventInfo, MediaLoadData mediaLoadData) {

  }

  @Override
  public void onLoadCompleted(int windowIndex, @Nullable MediaSource.MediaPeriodId mediaPeriodId, LoadEventInfo loadEventInfo, MediaLoadData mediaLoadData) {

  }

  @Override
  public void onLoadCanceled(int windowIndex, @Nullable MediaSource.MediaPeriodId mediaPeriodId, LoadEventInfo loadEventInfo, MediaLoadData mediaLoadData) {

  }

  @Override
  public void onLoadError(int windowIndex, @Nullable MediaSource.MediaPeriodId mediaPeriodId, LoadEventInfo loadEventInfo, MediaLoadData mediaLoadData, IOException error, boolean wasCanceled) {

  }

  @Override
  public void onReadingStarted(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId) {

  }

  @Override
  public void onUpstreamDiscarded(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId, MediaLoadData mediaLoadData) {

  }

  @Override
  public void onDownstreamFormatChanged(int windowIndex, @Nullable MediaSource.MediaPeriodId mediaPeriodId, MediaLoadData mediaLoadData) {

  }
}
