package expo.modules.core.interfaces;

import android.app.Activity;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactRootView;

import androidx.annotation.Nullable;

/**
 * A handler API for modules to override default ReactActivityDelegate behaviors.
 * Used by {@link ReactActivityDelegateWrapper}
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

  default boolean shouldNoop() {
    return false;
  }

  default void onWillCreateReactActivityDelegate(ReactActivity activity) {}
}
