package abi36_0_0.host.exp.exponent.modules.api.safeareacontext;

import abi36_0_0.com.facebook.react.bridge.Arguments;
import abi36_0_0.com.facebook.react.bridge.WritableMap;
import abi36_0_0.com.facebook.react.uimanager.PixelUtil;
import abi36_0_0.com.facebook.react.uimanager.events.Event;
import abi36_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

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
    WritableMap insets = Arguments.createMap();
    insets.putDouble("top", PixelUtil.toDIPFromPixel(mInsets.top));
    insets.putDouble("right", PixelUtil.toDIPFromPixel(mInsets.right));
    insets.putDouble("bottom", PixelUtil.toDIPFromPixel(mInsets.bottom));
    insets.putDouble("left", PixelUtil.toDIPFromPixel(mInsets.left));
    WritableMap event = Arguments.createMap();
    event.putMap("insets", insets);
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), event);
  }
}
