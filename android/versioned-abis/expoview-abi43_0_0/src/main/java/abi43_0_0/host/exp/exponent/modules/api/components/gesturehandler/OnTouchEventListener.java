package abi43_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.MotionEvent;

public interface OnTouchEventListener<T extends GestureHandler> {
  void onTouchEvent(T handler, MotionEvent event);
  void onStateChange(T handler, int newState, int oldState);
}
