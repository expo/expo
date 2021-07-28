package expo.modules.adapters.react.services;

import android.os.Bundle;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.util.Collections;
import java.util.List;

import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.services.EventEmitter;

public class EventEmitterModule implements EventEmitter, InternalModule {
  private ReactContext mReactContext;

  public EventEmitterModule(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  public void emit(String eventName, Bundle eventBody) {
    mReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, Arguments.fromBundle(eventBody));
  }

  @Override
  public void emit(final int viewId, final Event event) {
    mReactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(getReactEventFromEvent(viewId, event));
  }

  @Override
  public void emit(final int viewId, final String eventName, final Bundle eventBody) {
    mReactContext.getNativeModule(UIManagerModule.class).getEventDispatcher().dispatchEvent(new com.facebook.react.uimanager.events.Event(viewId) {
      @Override
      public String getEventName() {
        return eventName;
      }

      @Override
      public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(viewId, eventName, eventBody != null ? Arguments.fromBundle(eventBody) : null);
      }

      @Override
      public boolean canCoalesce() {
        return false;
      }

      @Override
      public short getCoalescingKey() {
        return 0;
      }
    });
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) EventEmitter.class);
  }

  private static com.facebook.react.uimanager.events.Event getReactEventFromEvent(final int viewId, final Event event) {
    return new com.facebook.react.uimanager.events.Event(viewId) {
      @Override
      public String getEventName() {
        return event.getEventName();
      }

      @Override
      public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(viewId, event.getEventName(), Arguments.fromBundle(event.getEventBody()));
      }

      @Override
      public boolean canCoalesce() {
        return event.canCoalesce();
      }

      @Override
      public short getCoalescingKey() {
        return event.getCoalescingKey();
      }
    };
  }
}
