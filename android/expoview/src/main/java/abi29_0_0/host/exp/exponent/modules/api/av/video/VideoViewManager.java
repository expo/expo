package abi29_0_0.host.exp.exponent.modules.api.av.video;

import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.com.facebook.react.common.MapBuilder;
import abi29_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi29_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi29_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import com.yqritc.scalablevideoview.ScalableType;

import java.util.Map;

import javax.annotation.Nullable;

public class VideoViewManager extends SimpleViewManager<VideoViewWrapper> {
  public static final String REACT_CLASS = "ExponentVideo";

  private static final String PROP_STATUS = "status";
  private static final String PROP_USE_NATIVE_CONTROLS = "useNativeControls";
  private static final String PROP_SOURCE = "source";
  private static final String PROP_NATIVE_RESIZE_MODE = "nativeResizeMode";

  enum FullscreenPlayerUpdate {
    FULLSCREEN_PLAYER_WILL_PRESENT(0),
    FULLSCREEN_PLAYER_DID_PRESENT(1),
    FULLSCREEN_PLAYER_WILL_DISMISS(2),
    FULLSCREEN_PLAYER_DID_DISMISS(3);

    private final int mValue;
    FullscreenPlayerUpdate(final int value) {
      mValue = value;
    }

    public int getValue() { return mValue; }
  }

  enum Events {
    EVENT_STATUS_UPDATE("onStatusUpdateNative"),
    EVENT_LOAD_START("onLoadStartNative"),
    EVENT_LOAD("onLoadNative"),
    EVENT_ERROR("onErrorNative"),
    EVENT_READY_FOR_DISPLAY("onReadyForDisplayNative"),
    EVENT_FULLSCREEN_PLAYER_UPDATE("onFullscreenUpdateNative");

    private final String mName;

    Events(final String name) {
      mName = name;
    }

    @Override
    public String toString() {
      return mName;
    }
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected VideoViewWrapper createViewInstance(final ThemedReactContext themedReactContext) {
    return new VideoViewWrapper(themedReactContext);
  }

  @Override
  public void onDropViewInstance(final VideoViewWrapper videoViewWrapper) {
    super.onDropViewInstance(videoViewWrapper);
    videoViewWrapper.getVideoViewInstance().onDropViewInstance();
  }

  @Override
  @Nullable
  public Map<String, Object> getExportedViewConstants() {
    // We cast the values as Object so that MapBuilder gives a Map<String, Object> instance.
    return MapBuilder.of(
        "ScaleNone", (Object) Integer.toString(ScalableType.LEFT_TOP.ordinal()),
        "ScaleToFill", (Object) Integer.toString(ScalableType.FIT_XY.ordinal()),
        "ScaleAspectFit", (Object) Integer.toString(ScalableType.FIT_CENTER.ordinal()),
        "ScaleAspectFill", (Object) Integer.toString(ScalableType.CENTER_CROP.ordinal())
    );
  }

  // Props set directly in <Video> component:

  @ReactProp(name = PROP_STATUS)
  public void setStatus(final VideoViewWrapper videoViewWrapper, final ReadableMap status) {
    videoViewWrapper.getVideoViewInstance().setStatus(status, null);
  }

  @ReactProp(name = PROP_USE_NATIVE_CONTROLS, defaultBoolean = false)
  public void setUseNativeControls(final VideoViewWrapper videoViewWrapper, final boolean useNativeControls) {
    videoViewWrapper.getVideoViewInstance().setUseNativeControls(useNativeControls);
  }

  // Native only props -- set by Video.js

  @ReactProp(name = PROP_SOURCE)
  public void setSource(final VideoViewWrapper videoViewWrapper, final @Nullable ReadableMap source) {
    videoViewWrapper.getVideoViewInstance().setSource(source, null, null);
  }

  @ReactProp(name = PROP_NATIVE_RESIZE_MODE, defaultBoolean = false)
  public void setNativeResizeMode(final VideoViewWrapper videoViewWrapper, final String resizeModeOrdinalString) {
    videoViewWrapper.getVideoViewInstance().setResizeMode(ScalableType.values()[Integer.parseInt(resizeModeOrdinalString)]);
  }

  @Override
  @Nullable
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    MapBuilder.Builder<String, Object> builder = MapBuilder.builder();
    for (Events event : Events.values()) {
      builder.put(event.toString(), MapBuilder.of("registrationName", event.toString()));
    }
    return builder.build();
  }
}
