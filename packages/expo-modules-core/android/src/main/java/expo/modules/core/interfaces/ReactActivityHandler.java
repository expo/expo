package expo.modules.core.interfaces;

import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.MotionEvent;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactNativeHost;

import androidx.annotation.Nullable;

/**
 * A handler API for modules to override default ReactActivity behaviors.
 * Used by {@link expo.modules.ReactActivityWrapper}
 */
public interface ReactActivityHandler {

  default boolean onNewIntent(ReactActivity activity, Intent intent) {
    return false;
  }

  default void onPostCreate(Bundle savedInstanceState, ReactNativeHost reactNativeHost) {}

  default boolean dispatchTouchEvent(MotionEvent ev) {
    return false;
  }

  default boolean onKeyUp(int keyCode, KeyEvent event) {
    return false;
  }
}
