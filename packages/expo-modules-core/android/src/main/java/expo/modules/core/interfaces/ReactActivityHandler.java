package expo.modules.core.interfaces;

import android.app.Activity;
import android.view.KeyEvent;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactDelegate;
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

  default boolean onKeyUp(int keyCode, KeyEvent event) {
    return false;
  }

  /**
   * Called once, at the time the wrapper object is initialized. Opportunity for a module to declare
   * that this wrapper should ignore certain method calls and not pass them through to the wrapped
   * delegate.
   * @return true if this wrapper should no-op on certain method calls, false otherwise
   */
  default boolean shouldNoop() {
    return false;
  }

  /**
   * Called when the wrapper object is initialized.
   */
  default void onWillCreateReactActivityDelegate(ReactActivity activity) {}
}
