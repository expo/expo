package abi47_0_0.expo.modules.adapters.react.services;

import android.os.Bundle;

import abi47_0_0.com.facebook.react.bridge.Arguments;
import abi47_0_0.com.facebook.react.bridge.ReactContext;
import abi47_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import abi47_0_0.com.facebook.react.uimanager.UIManagerHelper;
import abi47_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi47_0_0.com.facebook.react.uimanager.events.EventDispatcher;
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

import java.util.Collections;
import java.util.List;

import abi47_0_0.expo.modules.adapters.react.views.ViewManagerAdapterUtils;
import abi47_0_0.expo.modules.core.interfaces.InternalModule;
import abi47_0_0.expo.modules.core.interfaces.services.EventEmitter;

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
    final EventDispatcher dispatcher = UIManagerHelper.getEventDispatcherForReactTag(mReactContext, viewId);
    dispatcher.dispatchEvent(getReactEventFromEvent(viewId, event));
  }

  @Override
  public void emit(final int viewId, final String eventName, final Bundle eventBody) {
    final EventDispatcher dispatcher = UIManagerHelper.getEventDispatcherForReactTag(mReactContext, viewId);
    dispatcher.dispatchEvent(new abi47_0_0.com.facebook.react.uimanager.events.Event(viewId) {
      @Override
      public String getEventName() {
        return ViewManagerAdapterUtils.normalizeEventName(eventName);
      }

      @Override
      public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(viewId, getEventName(), eventBody != null ? Arguments.fromBundle(eventBody) : null);
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

  private static abi47_0_0.com.facebook.react.uimanager.events.Event getReactEventFromEvent(final int viewId, final Event event) {
    return new abi47_0_0.com.facebook.react.uimanager.events.Event(viewId) {
      @Override
      public String getEventName() {
        return ViewManagerAdapterUtils.normalizeEventName(event.getEventName());
      }

      @Override
      public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(viewId, getEventName(), Arguments.fromBundle(event.getEventBody()));
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
