package expo.modules.keepawake;

import android.app.Activity;
import android.view.WindowManager;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.errors.CurrentActivityNotFoundException;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.KeepAwakeManager;

import java.util.Collections;
import java.util.List;

public class ExpoKeepAwakeManager implements KeepAwakeManager, InternalModule, ModuleRegistryConsumer {

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
  public void activate(final Runnable done) throws CurrentActivityNotFoundException {
    final Activity activity = getCurrentActivity();

    if (activity != null) {
      activity.runOnUiThread(() -> {
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        mIsActivated = true;
        done.run();
      });
    }
  }

  @Override
  public void deactivate(final Runnable done) throws CurrentActivityNotFoundException {
    final Activity activity = getCurrentActivity();

    if (activity != null) {
      activity.runOnUiThread(() -> {
        mIsActivated = false;
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      });
    }
    done.run();
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
