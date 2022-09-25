package expo.modules.core.interfaces;

import android.app.Activity;
import android.view.KeyEvent;
import android.view.ViewGroup;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

import androidx.annotation.Nullable;

/**
 * A handler API for modules to override default ReactActivityDelegate behaviors.
 * Used by {@link ReactActivityDelegateWrapper}
 */
public interface ReactActivityHandler {
  /**
   * Given modules a chance to override the default {@link ReactRootView}
   * @return the override ReactRootView instance or null if not to override
   */
  @Nullable
  default ReactRootView createReactRootView(Activity activity) {
    return null;
  }

  /**
   * Gives modules a chance to create a ViewGroup that is used as a container for the ReactRootView,
   * which is added as a child to the container if non-null.
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
   * Gives modules a chance to override the wrapped ReactActivityDelegate instance.
   * @return a new ReactActivityDelegate instance, or null if not to override
   */
  @Nullable
  default ReactActivityDelegate onDidCreateReactActivityDelegate(ReactActivity activity, ReactActivityDelegate delegate) {
    return null;
  }
}
