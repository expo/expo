package expo.modules.core.interfaces;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

public interface ReactActivityLifecycleListener {
  default void onCreate(Activity activity, Bundle savedInstanceState) {}

  default void onResume(Activity activity) {}

  default void onPause(Activity activity) {}

  default void onDestroy(Activity activity) {}

  /**
   * Called when {@link com.facebook.react.ReactActivity} received `onNewIntent`
   * Every listener will receive this callback.
   * `ReactActivityDelegateWrapper.onNewIntent` will get `true` if there's some module returns `true`
   *
   * @return true if this module wants to return `true` from `ReactActivityDelegateWrapper.onNewIntent`
   */
  default boolean onNewIntent(Intent intent) {
    return false;
  }

  /**
   * Called when {@link com.facebook.react.ReactActivity} received `onBackPressed`
   * Every listener will receive this callback.
   * `ReactActivityDelegateWrapper.onBackPressed` will get `true` if there's some module returns `true`
   *
   * @return true if this module wants to return `true` from `ReactActivityDelegateWrapper.onBackPressed`
   */
  default boolean onBackPressed() {
    return false;
  }
}
