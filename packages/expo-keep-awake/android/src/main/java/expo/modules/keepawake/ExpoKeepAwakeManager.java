package expo.modules.keepawake;

import android.app.Activity;
import android.view.WindowManager;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.errors.CurrentActivityNotFoundException;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.KeepAwakeManager;

import java.util.Collections;
import java.util.List;

public class ExpoKeepAwakeManager implements KeepAwakeManager, InternalModule, ModuleRegistryConsumer {

  private final static String NO_ACTIVITY_ERROR_CODE = "NO_CURRENT_ACTIVITY";

  private ModuleRegistry mModuleRegistry;
  private boolean mIsActivated;

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    this.mModuleRegistry = moduleRegistry;
  }

  private Activity getCurrentActivity() throws CurrentActivityNotFoundException {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    if (activityProvider.getCurrentActivity() != null) {
      return activityProvider.getCurrentActivity();
    } else {
      throw new CurrentActivityNotFoundException();
    }
  }

  @Override
  public void activate(Promise promise) {
    try {
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
    } catch (CurrentActivityNotFoundException ex) {
      promise.reject(NO_ACTIVITY_ERROR_CODE, "Unable to activate keep awake");
    }
  }

  @Override
  public void deactivate(Promise promise) {
    try {
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
    } catch (CurrentActivityNotFoundException ex) {
      promise.reject(NO_ACTIVITY_ERROR_CODE, "Unable to deactivate keep awake. However, it probably is deactivated already.");
    }
  }

  @Override
  public boolean isActivated() {
    return mIsActivated;
  }

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(KeepAwakeManager.class);
  }
}
