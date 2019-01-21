package expo.modules.taskManager;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.ExportedModule;
import expo.core.BasePackage;
import expo.core.interfaces.InternalModule;
import expo.core.interfaces.SingletonModule;

public class TaskManagerPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new TaskManagerModule(context));
  }

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new TaskManagerInternalModule(context));
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Collections.singletonList((SingletonModule) new TaskService(context));
  }
}
