package versioned.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.MotionEvent;

import versioned.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;

public interface OnTouchEventListener<T extends GestureHandler> {
  void onTouchEvent(T handler, MotionEvent event);
  void onStateChange(T handler, int newState, int oldState);
}
