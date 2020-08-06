package expo.modules.av.video;

import android.content.Context;

import com.yqritc.scalablevideoview.ScalableType;

import java.util.ArrayList;
import java.util.List;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.ViewManager;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ExpoProp;

public class VideoViewManager extends ViewManager<VideoViewWrapper> {
  public static final String REACT_CLASS = "ExpoVideoView";

  private static final String PROP_STATUS = "status";
  private static final String PROP_USE_NATIVE_CONTROLS = "useNativeControls";
  private static final String PROP_SOURCE = "source";
  private static final String PROP_NATIVE_RESIZE_MODE = "resizeMode";

  private ModuleRegistry mModuleRegistry;

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  enum FullscreenPlayerUpdate {
    FULLSCREEN_PLAYER_WILL_PRESENT(0),
    FULLSCREEN_PLAYER_DID_PRESENT(1),
    FULLSCREEN_PLAYER_WILL_DISMISS(2),
    FULLSCREEN_PLAYER_DID_DISMISS(3);

    private final int mValue;

    FullscreenPlayerUpdate(final int value) {
      mValue = value;
    }

    public int getValue() {
      return mValue;
    }
  }

  enum Events {
    EVENT_STATUS_UPDATE("onStatusUpdate"),
    EVENT_LOAD_START("onLoadStart"),
    EVENT_LOAD("onLoad"),
    EVENT_ERROR("onError"),
    EVENT_READY_FOR_DISPLAY("onReadyForDisplay"),
    EVENT_FULLSCREEN_PLAYER_UPDATE("onFullscreenUpdate");

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
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.SIMPLE;
  }

  @Override
  public VideoViewWrapper createViewInstance(final Context themedReactContext) {
    return new VideoViewWrapper(themedReactContext, mModuleRegistry);
  }

  @Override
  public void onDropViewInstance(final VideoViewWrapper videoViewWrapper) {
    super.onDropViewInstance(videoViewWrapper);
    videoViewWrapper.getVideoViewInstance().onDropViewInstance();
  }

  // Props set directly in <Video> component:

  @ExpoProp(name = PROP_STATUS)
  public void setStatus(final VideoViewWrapper videoViewWrapper, final ReadableArguments status) {
    videoViewWrapper.getVideoViewInstance().setStatus(status, null);
  }

  @ExpoProp(name = PROP_USE_NATIVE_CONTROLS)
  public void setUseNativeControls(final VideoViewWrapper videoViewWrapper, final boolean useNativeControls) {
    videoViewWrapper.getVideoViewInstance().setUseNativeControls(useNativeControls);
  }

  // Native only props -- set by Video.js

  @ExpoProp(name = PROP_SOURCE)
  public void setSource(final VideoViewWrapper videoViewWrapper, final ReadableArguments source) {
    videoViewWrapper.getVideoViewInstance().setSource(source);
  }

  @ExpoProp(name = PROP_NATIVE_RESIZE_MODE)
  public void setNativeResizeMode(final VideoViewWrapper videoViewWrapper, final String resizeModeOrdinalString) {
    videoViewWrapper.getVideoViewInstance().setResizeMode(ScalableType.values()[Integer.parseInt(resizeModeOrdinalString)]);
  }

  @Override
  public List<String> getExportedEventNames() {
    List<String> eventNames = new ArrayList<>();
    for (Events event : Events.values()) {
      eventNames.add(event.toString());
    }
    return eventNames;
  }
}
