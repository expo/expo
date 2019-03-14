// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.keepawake;

import android.content.Context;
import android.app.Activity;
import android.view.WindowManager;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.KeepAwakeManager;

public class KeepAwakeModule extends ExportedModule implements ModuleRegistryConsumer, KeepAwakeManager {
  private static final String NAME = "ExpoKeepAwake";
  private static final String TAG = KeepAwakeModule.class.getSimpleName();

  private ModuleRegistry mModuleRegistry;
  private boolean mIsActivated = false;

  public KeepAwakeModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  private Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }


  @ExpoMethod
  public void activate(Promise promise) {
    final Activity activity = getCurrentActivity();

    if (activity != null) {
      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
          mIsActivated = true;
        }
      });
    }

    promise.resolve(true);
  }

  @ExpoMethod
  public void deactivate(Promise promise) {
    final Activity activity = getCurrentActivity();

    if (activity != null) {
      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          mIsActivated = false;
          activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
      });
    }
    promise.resolve(true);
  }

  public boolean isActivated() {
    return mIsActivated;
  }
}
