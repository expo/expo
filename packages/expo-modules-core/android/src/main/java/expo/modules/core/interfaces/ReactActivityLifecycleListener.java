package expo.modules.core.interfaces;

import android.app.Activity;
import android.os.Bundle;

public interface ReactActivityLifecycleListener {
  default void onCreate(Activity activity, Bundle savedInstanceState) {}

  default void onResume(Activity activity) {}

  default void onPause(Activity activity) {}

  default void onDestroy(Activity activity) {}
}
