package versioned.host.exp.exponent.modules.api.safeareacontext;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/* package */  class InsetsChangeEvent extends Event<InsetsChangeEvent> {
  public static final String EVENT_NAME = "topInsetsChange";

  private EdgeInsets mInsets;

  protected InsetsChangeEvent(int viewTag, EdgeInsets insets) {
    super(viewTag);

    mInsets = insets;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap event = Arguments.createMap();
    event.putMap("insets", SafeAreaUtils.edgeInsetsToJsMap(mInsets));
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), event);
  }
}
