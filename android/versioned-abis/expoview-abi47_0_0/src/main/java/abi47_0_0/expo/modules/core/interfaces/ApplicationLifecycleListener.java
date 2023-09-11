package abi47_0_0.expo.modules.core.interfaces;

import android.app.Application;
import android.content.res.Configuration;

public interface ApplicationLifecycleListener {
  default void onCreate(Application application) {}

  default void onConfigurationChanged(Configuration newConfig) {}
}
