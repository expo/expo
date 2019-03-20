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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ExpoKeepAwakeManager implements KeepAwakeManager, InternalModule, ModuleRegistryConsumer {

  private ModuleRegistry mModuleRegistry;
  private Set<String> mTags = new HashSet<>();

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
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
  public void activate(final String tag, final Runnable done) throws CurrentActivityNotFoundException {
    final Activity activity = getCurrentActivity();

    if (!isActivated()) {
      if (activity != null) {
        activity.runOnUiThread(() -> activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON));
      }
    }
    mTags.add(tag);
    done.run();
  }

  @Override
  public void deactivate(final String tag, final Runnable done) throws CurrentActivityNotFoundException {
    final Activity activity = getCurrentActivity();
    if (isActivated() && activity != null) {
      activity.runOnUiThread(() -> activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON));
    }
    mTags.remove(tag);
    done.run();
  }

  @Override
  public boolean isActivated() {
    return mTags.size() > 0;
  }

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(KeepAwakeManager.class);
  }
}
