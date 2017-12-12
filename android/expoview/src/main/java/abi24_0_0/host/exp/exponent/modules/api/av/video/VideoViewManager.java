package abi24_0_0.host.exp.exponent.modules.api.av.video;

import android.net.Uri;

import abi24_0_0.com.facebook.react.bridge.ReadableMap;
import abi24_0_0.com.facebook.react.common.MapBuilder;
import abi24_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi24_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi24_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import com.yqritc.scalablevideoview.ScalableType;

import java.util.Map;

import javax.annotation.Nullable;

public class VideoViewManager extends SimpleViewManager<VideoView> {
  public static final String REACT_CLASS = "ExponentVideo";

  private static final String PROP_STATUS = "status";
  private static final String PROP_USE_NATIVE_CONTROLS = "useNativeControls";
  private static final String PROP_URI = "uri";
  private static final String PROP_NATIVE_RESIZE_MODE = "nativeResizeMode";

  enum Events {
    EVENT_STATUS_UPDATE("onStatusUpdateNative"),
    EVENT_LOAD_START("onLoadStartNative"),
    EVENT_LOAD("onLoadNative"),
    EVENT_ERROR("onErrorNative"),
    EVENT_READY_FOR_DISPLAY("onReadyForDisplayNative");

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
  protected VideoView createViewInstance(final ThemedReactContext themedReactContext) {
    return new VideoView(themedReactContext);
  }

  @Override
  public void onDropViewInstance(final VideoView view) {
    super.onDropViewInstance(view);
    view.onDropViewInstance();
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
  public void setStatus(final VideoView videoView, final ReadableMap status) {
    videoView.setStatus(status, null);
  }

  @ReactProp(name = PROP_USE_NATIVE_CONTROLS, defaultBoolean = false)
  public void setUseNativeControls(final VideoView videoView, final boolean useNativeControls) {
    videoView.setUseNativeControls(useNativeControls);
  }

  // Native only props -- set by Video.js

  @ReactProp(name = PROP_URI)
  public void setUri(final VideoView videoView, final @Nullable String uri) {
    videoView.setUri(uri == null ? null : Uri.parse(uri), null, null);
  }

  @ReactProp(name = PROP_NATIVE_RESIZE_MODE, defaultBoolean = false)
  public void setNativeResizeMode(final VideoView videoView, final String resizeModeOrdinalString) {
    videoView.setResizeMode(ScalableType.values()[Integer.parseInt(resizeModeOrdinalString)]);
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
