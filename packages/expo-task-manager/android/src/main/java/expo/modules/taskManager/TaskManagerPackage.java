package expo.modules.taskManager;

import android.content.Context;

import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.SingletonModule;

import java.util.Collections;
import java.util.List;

public class TaskManagerPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList(new TaskManagerInternalModule(context));
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Collections.singletonList(new TaskService(context));
  }
}
