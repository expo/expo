package abi44_0_0.host.exp.exponent.modules.api.safeareacontext;

import abi44_0_0.com.facebook.react.bridge.Arguments;
import abi44_0_0.com.facebook.react.bridge.WritableMap;
import abi44_0_0.com.facebook.react.uimanager.events.Event;
import abi44_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

/* package */  class InsetsChangeEvent extends Event<InsetsChangeEvent> {
  static final String EVENT_NAME = "topInsetsChange";

  private EdgeInsets mInsets;
  private Rect mFrame;

  InsetsChangeEvent(int viewTag, EdgeInsets insets, Rect frame) {
    super(viewTag);

    mInsets = insets;
    mFrame = frame;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap event = Arguments.createMap();
    event.putMap("insets", SerializationUtils.edgeInsetsToJsMap(mInsets));
    event.putMap("frame", SerializationUtils.rectToJsMap(mFrame));
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), event);
  }
}
