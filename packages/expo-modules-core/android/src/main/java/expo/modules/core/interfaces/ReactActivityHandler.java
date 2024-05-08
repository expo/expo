package expo.modules.core.interfaces;

import android.app.Activity;
import android.view.KeyEvent;
import android.view.ViewGroup;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactNativeHost;

import androidx.annotation.Nullable;

/**
 * A handler API for modules to override default ReactActivityDelegate behaviors.
 * Used by {@link ReactActivityDelegateWrapper}
 */
public interface ReactActivityHandler {
  /**
   * Gives modules a chance to create a ViewGroup that is used as a container for the ReactRootView,
   * which is added as a child to the container if non-null.
   *
   * @return a ViewGroup to be used as a container, or null if no container is needed
   */
  @Nullable
  default ViewGroup createReactRootViewContainer(Activity activity) {
    return null;
  }

  /**
   * Gives modules a chance to respond to `onKeyUp` events. Every listener will receive this
   * callback, but the delegate will not receive the event unless if any of the listeners consume it
   * (i.e. return `true` from this method).
   * `ReactActivityDelegateWrapper.onKeyUp` will return `true` if any module returns `true`.
   *
   * @return true if this module wants to return `true` from `ReactActivityDelegateWrapper.onKeyUp`
   */
  default boolean onKeyUp(int keyCode, KeyEvent event) {
    return false;
  }

  /**
   * Gives modules a chance to respond to `onKeyDown` events. Every listener will receive this
   * callback, but the delegate will not receive the event unless if any of the listeners consume it
   * (i.e. return `true` from this method).
   * `ReactActivityDelegateWrapper.onKeyDown` will return `true` if any module returns `true`.
   *
   * @return true if this module wants to return `true` from `ReactActivityDelegateWrapper.onKeyDown`
   */
  default boolean onKeyDown(int keyCode, @Nullable KeyEvent event) {
    return false;
  }

  /**
   * Gives modules a chance to respond to `onKeyLongPress` events. Every listener will receive this
   * callback, but the delegate will not receive the event unless if any of the listeners consume it
   * (i.e. return `true` from this method).
   * `ReactActivityDelegateWrapper.onKeyLongPress` will return `true` if any module returns `true`.
   *
   * @return true if this module wants to return `true` from `ReactActivityDelegateWrapper.onKeyLongPress`
   */
  default boolean onKeyLongPress(int keyCode, @Nullable KeyEvent event) {
    return false;
  }

  /**
   * Gives modules a chance to override the wrapped ReactActivityDelegate instance.
   *
   * @return a new ReactActivityDelegate instance, or null if not to override
   */
  @Nullable
  default ReactActivityDelegate onDidCreateReactActivityDelegate(ReactActivity activity, ReactActivityDelegate delegate) {
    return null;
  }

  /**
   * For modules to delay the call for react-native `loadApp`.
   * This gives modules a chance to do some early and heavy initialization in background thread and avoid ANR.
   * Right now it is for expo-updates only.
   */
  @Nullable
  default DelayLoadAppHandler getDelayLoadAppHandler(ReactActivity activity, ReactNativeHost reactNativeHost) {
    return null;
  }

  interface DelayLoadAppHandler {
    void whenReady(Runnable runnable);
  }
}
