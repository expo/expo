package expo.modules.av.player;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;

import android.text.TextUtils;
import android.util.Log;
import android.util.Pair;
import android.view.Surface;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.common.MapBuilder;

import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.PlaybackException;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.source.LoadEventInfo;
import com.google.android.exoplayer2.source.MediaLoadData;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.MediaSourceEventListener;
import com.google.android.exoplayer2.source.ProgressiveMediaSource;
import com.google.android.exoplayer2.source.dash.DashMediaSource;
import com.google.android.exoplayer2.source.dash.DefaultDashChunkSource;
import com.google.android.exoplayer2.drm.DefaultDrmSessionManager;
import com.google.android.exoplayer2.drm.DefaultDrmSessionEventListener;
import com.google.android.exoplayer2.drm.DrmSessionManager;
import com.google.android.exoplayer2.drm.FrameworkMediaCrypto;
import com.google.android.exoplayer2.drm.FrameworkMediaDrm;
import com.google.android.exoplayer2.drm.HttpMediaDrmCallback;
import com.google.android.exoplayer2.drm.UnsupportedDrmException;
import com.google.android.exoplayer2.source.hls.HlsMediaSource;
import com.google.android.exoplayer2.source.smoothstreaming.DefaultSsChunkSource;
import com.google.android.exoplayer2.source.smoothstreaming.SsMediaSource;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelector;
import com.google.android.exoplayer2.upstream.BandwidthMeter;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.RawResourceDataSource;
import com.google.android.exoplayer2.util.Util;
import com.google.android.exoplayer2.video.VideoSize;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.upstream.DefaultAllocator;
import com.google.android.exoplayer2.DefaultLoadControl;
import com.google.android.exoplayer2.DefaultRenderersFactory;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import expo.modules.av.AVManagerInterface;
import expo.modules.av.AudioFocusNotAcquiredException;
import expo.modules.av.player.datasource.DataSourceFactoryProvider;
import expo.modules.core.arguments.ReadableArguments;

class SimpleExoPlayerData extends PlayerData
  implements Player.Listener, MediaSourceEventListener, DefaultDrmSessionEventListener {

  private static final String PROP_DRM = "drm";
  private static final String PROP_DRM_TYPE = "type";
  private static final String PROP_DRM_LICENSESERVER = "licenseServer";
  private static final String PROP_DRM_HEADERS = "headers";
  private static final String IMPLEMENTATION_NAME = "SimpleExoPlayer";
  private static final String TAG = SimpleExoPlayerData.class.getSimpleName();

  private SimpleExoPlayer mSimpleExoPlayer = null;
  private final String mOverridingExtension;
  private LoadCompletionListener mLoadCompletionListener = null;
  private boolean mFirstFrameRendered = false;
  private Pair<Integer, Integer> mVideoWidthHeight = null;
  private Integer mLastPlaybackState = null;
  private boolean mIsLooping = false;
  private boolean mIsLoading = true;
  private UUID drmUUID = null;
  private String drmLicenseUrl = null;
  private String[] drmLicenseHeader = null;
  private final Context mReactContext;

  SimpleExoPlayerData(final AVManagerInterface avModule, final Context context, final Uri uri, final String overridingExtension, final Map<String, Object> requestHeaders, final ReadableArguments drmConfigs) {
    super(avModule, uri, requestHeaders);
    mReactContext = context;
    mOverridingExtension = overridingExtension;
    if(drmConfigs != null){
      this.setDRM(drmConfigs);
    }
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

    final Context context = mAVModule.getContext();
    final BandwidthMeter bandwidthMeter = new DefaultBandwidthMeter.Builder(context).build();
    final TrackSelector trackSelector = new DefaultTrackSelector(context, new AdaptiveTrackSelection.Factory());

    // Create the player
    // mSimpleExoPlayer = new SimpleExoPlayer.Builder(context)
    //     .setTrackSelector(trackSelector)
    //     .setBandwidthMeter(bandwidthMeter)
    //     .build();
    DefaultAllocator allocator = new DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE);
                    DefaultLoadControl.Builder defaultLoadControlBuilder = new DefaultLoadControl.Builder();
                    defaultLoadControlBuilder.setAllocator(allocator);
                    defaultLoadControlBuilder.setTargetBufferBytes(-1);
                    defaultLoadControlBuilder.setPrioritizeTimeOverSizeThresholds(true);
                    DefaultLoadControl defaultLoadControl = defaultLoadControlBuilder.createDefaultLoadControl();
                    DefaultRenderersFactory renderersFactory =
                            new DefaultRenderersFactory(getContext())
                                    .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_OFF);
    
    DrmSessionManager<FrameworkMediaCrypto> drmSessionManager = null;
    if (self.drmUUID != null) {
        try {
            drmSessionManager = buildDrmSessionManager(self.drmUUID, self.drmLicenseUrl,
                    self.drmLicenseHeader);
        } catch (UnsupportedDrmException e) {
            int errorStringId = Util.SDK_INT < 18 ? R.string.error_drm_not_supported
                    : (e.reason == UnsupportedDrmException.REASON_UNSUPPORTED_SCHEME
                    ? R.string.error_drm_unsupported_scheme : R.string.error_drm_unknown);
            eventEmitter.error(getResources().getString(errorStringId), e);
            return;
        }
    }
    mSimpleExoPlayer = ExoPlayerFactory.newSimpleInstance(context, renderersFactory,
    trackSelector, defaultLoadControl, drmSessionManager, bandwidthMeter);

    mSimpleExoPlayer.addListener(this);
    // Produces DataSource instances through which media data is loaded.
    final DataSource.Factory dataSourceFactory = mAVModule.getModuleRegistry()
        .getModule(DataSourceFactoryProvider.class)
        .createFactory(
            mReactContext,
            mAVModule.getModuleRegistry(),
            Util.getUserAgent(context, "yourApplicationName"),
            mRequestHeaders,
            bandwidthMeter.getTransferListener());
    try {
      // This is the MediaSource representing the media to be played.
      final MediaSource source = buildMediaSource(mUri, mOverridingExtension, dataSourceFactory);

      // Prepare the player with the source.
      mSimpleExoPlayer.prepare(source);
      setStatus(status, null);
    } catch (IllegalStateException e) {
      onFatalError(e);
    }
  }

  @Override
  public synchronized void release() {
    super.release();
    stopUpdatingProgressIfNecessary();
    if (mSimpleExoPlayer != null) {
      mSimpleExoPlayer.release();
      mSimpleExoPlayer = null;
    }
  }

  @Override
  protected double getCurrentPositionSeconds() {
    // TODO: Find a way to fix "IllegalStateException: SimpleExoPlayer is accessed on the wrong thread."
    // this is called synchronously on JS thread while SimpleExoPlayer is accessed on main thread.
    return -1.0;
    // return (double)mSimpleExoPlayer.getCurrentPosition() / 1000.0;
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

  // region AudioEventHandler

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

  // endregion

  // region Player.Listener

  @Override
  public void onLoadingChanged(final boolean isLoading) {
    mIsLoading = isLoading;
    callStatusUpdateListener();
  }

  @Override
  public void onPlaybackParametersChanged(PlaybackParameters parameters) {
  }

  @Override
  public void onRepeatModeChanged(int repeatMode) {
  }

  @Override
  public void onShuffleModeEnabledChanged(boolean shuffleModeEnabled) {

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
  public void onPlayerError(PlaybackException error) {
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
    if (reason == Player.DISCONTINUITY_REASON_AUTO_TRANSITION) {
      callStatusUpdateListenerWithDidJustFinish();
    }
  }

  @Override
  public void onVideoSizeChanged(VideoSize videoSize) {
    mVideoWidthHeight = new Pair<>(videoSize.width, videoSize.height);
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

  // endregion

  // region MediaSourceEventListener

  @Override
  public void onLoadError(
      int windowIndex,
      @Nullable MediaSource.MediaPeriodId mediaPeriodId,
      LoadEventInfo loadEventInfo,
      MediaLoadData mediaLoadData,
      IOException error,
      boolean wasCanceled
  ) {
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

  // endregion
  private DrmSessionManager<FrameworkMediaCrypto> buildDrmSessionManager(UUID uuid,
      String licenseUrl, String[] keyRequestPropertiesArray) throws UnsupportedDrmException {
     if (Util.SDK_INT < 18) {
       return null;
      }
      HttpMediaDrmCallback drmCallback = new HttpMediaDrmCallback(licenseUrl, buildHttpDataSourceFactory(false));
      if (keyRequestPropertiesArray != null) {
        for (int i = 0; i < keyRequestPropertiesArray.length - 1; i += 2) {
          drmCallback.setKeyRequestProperty(keyRequestPropertiesArray[i],
          keyRequestPropertiesArray[i + 1]);
        }
      }
      return new DefaultDrmSessionManager<>(uuid,
      FrameworkMediaDrm.newInstance(uuid), drmCallback, null, false, 3);
  }
  private MediaSource buildMediaSource(@NonNull Uri uri, String overrideExtension, DataSource.Factory factory) {
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
        return new SsMediaSource.Factory(new DefaultSsChunkSource.Factory(factory), factory).createMediaSource(MediaItem.fromUri(uri));
      case C.TYPE_DASH:
        return new DashMediaSource.Factory(new DefaultDashChunkSource.Factory(factory), factory).createMediaSource(MediaItem.fromUri(uri));
      case C.TYPE_HLS:
        return new HlsMediaSource.Factory(factory).createMediaSource(MediaItem.fromUri(uri));
      case C.TYPE_OTHER:
        return new ProgressiveMediaSource.Factory(factory).createMediaSource(MediaItem.fromUri(uri));
      default: {
        throw new IllegalStateException("Content of this type is unsupported at the moment. Unsupported type: " + type);
      }
    }
  }
  /**
     * Returns a new HttpDataSource factory.
     *
     * @param useBandwidthMeter Whether to set {@link #bandwidthMeter} as a listener to the new
     *     DataSource factory.
     * @return A new HttpDataSource factory.
     */
    private HttpDataSource.Factory buildHttpDataSourceFactory(boolean useBandwidthMeter) {
      return DataSourceUtil.getDefaultHttpDataSourceFactory(this.themedReactContext, useBandwidthMeter ? bandwidthMeter : null, requestHeaders);
  }
  // region MediaSourceEventListener

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
  public void onUpstreamDiscarded(int windowIndex, MediaSource.MediaPeriodId mediaPeriodId, MediaLoadData mediaLoadData) {

  }

  @Override
  public void onDownstreamFormatChanged(int windowIndex, @Nullable MediaSource.MediaPeriodId mediaPeriodId, MediaLoadData mediaLoadData) {

  }

  // endregion

  public void setDRM(final ReadableArguments drm) {
    if (drm != null && drm.hasKey(PROP_DRM_TYPE)) {
      String drmType = drm.hasKey(PROP_DRM_TYPE) ? drm.getString(PROP_DRM_TYPE) : null;
      String drmLicenseServer = drm.hasKey(PROP_DRM_LICENSESERVER) ? drm.getString(PROP_DRM_LICENSESERVER) : null;
      ReadableMap drmHeaders = drm.hasKey(PROP_DRM_HEADERS) ? drm.getMap(PROP_DRM_HEADERS) : null;
      if (drmType != null && drmLicenseServer != null && Util.getDrmUuid(drmType) != null) {
          UUID drmUUID = Util.getDrmUuid(drmType);
          setDrmType(drmUUID);//
          setDrmLicenseUrl(drmLicenseServer);//
          if (drmHeaders != null) {
              ArrayList<String> drmKeyRequestPropertiesList = new ArrayList<>();
              ReadableMapKeySetIterator itr = drmHeaders.keySetIterator();
              while (itr.hasNextKey()) {
                  String key = itr.nextKey();
                  drmKeyRequestPropertiesList.add(key);
                  drmKeyRequestPropertiesList.add(drmHeaders.getString(key));
              }
              setDrmLicenseHeader(drmKeyRequestPropertiesList.toArray(new String[0]));//
          }
          // videoView.setUseTextureView(false);
      }
    }
  }

  public void setDrmType(UUID drmType) {
    this.drmUUID = drmType;
  }

  public UUID getDrmType(){
    return drmUUID;
  }

  public void setDrmLicenseUrl(String licenseUrl) {
      this.drmLicenseUrl = licenseUrl;
  }

  public String getDrmLicenseUrl() {
    return this.drmLicenseUrl;
  }

  public void setDrmLicenseHeader(String[] header){
      this.drmLicenseHeader = header;
  }

  public String[] getDrmLicenseHeaders() {
    return this.drmLicenseHeader;
  }

  @Override
  public void onDrmKeysLoaded() {
      Log.d("DRM Info", "onDrmKeysLoaded");
  }

  @Override
  public void onDrmSessionManagerError(Exception e) {
      Log.d("DRM Info", "onDrmSessionManagerError");
      eventEmitter.error("onDrmSessionManagerError", e);
  }

  @Override
  public void onDrmKeysRestored() {
      Log.d("DRM Info", "onDrmKeysRestored");
  }

  @Override
  public void onDrmKeysRemoved() {
      Log.d("DRM Info", "onDrmKeysRemoved");
  }
}
