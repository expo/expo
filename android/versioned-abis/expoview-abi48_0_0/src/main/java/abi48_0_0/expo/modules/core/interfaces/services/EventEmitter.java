package abi48_0_0.expo.modules.core.interfaces.services;

import android.os.Bundle;

public interface EventEmitter {
  interface Event {
    boolean canCoalesce();
    short getCoalescingKey();
    String getEventName();
    Bundle getEventBody();
  }

  abstract class BaseEvent implements Event {
    @Override
    public boolean canCoalesce() {
      return true;
    }

    @Override
    public short getCoalescingKey() {
      return 0;
    }
  }

  void emit(int viewId, String eventName, Bundle eventBody);
  void emit(String eventName, Bundle eventBody);
  void emit(int viewId, Event event);
}
