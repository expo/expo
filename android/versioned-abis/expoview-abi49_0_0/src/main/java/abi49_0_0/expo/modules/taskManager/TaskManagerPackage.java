package abi49_0_0.expo.modules.taskManager;

import android.content.Context;

import abi49_0_0.expo.modules.core.BasePackage;
import abi49_0_0.expo.modules.core.ExportedModule;
import abi49_0_0.expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.SingletonModule;

import java.util.Collections;
import java.util.List;

public class TaskManagerPackage extends BasePackage {

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new TaskManagerModule(context));
  }

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList(new TaskManagerInternalModule(context));
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Collections.singletonList(new TaskService(context));
  }
}
