package expo.modules.core.interfaces;

import android.app.Activity;
import android.view.KeyEvent;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactDelegate;
import com.facebook.react.ReactRootView;

import androidx.annotation.Nullable;

/**
 * A handler API for modules to override default ReactActivityDelegate behaviors.
 * Used by {@link expo.modules.ReactActivityDelegateWrapper}
 */
public interface ReactActivityDelegateHandler {
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
   * Called when the wrapper object is initialized.
   */
  @Nullable
  default ReactActivityDelegate onDidCreateReactActivityDelegate(ReactActivity activity, ReactActivityDelegate delegate) {
    return null;
  }
}
