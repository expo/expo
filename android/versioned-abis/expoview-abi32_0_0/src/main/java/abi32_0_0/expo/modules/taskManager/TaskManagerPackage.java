package abi32_0_0.expo.modules.taskManager;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi32_0_0.expo.core.ExportedModule;
import abi32_0_0.expo.core.BasePackage;
import abi32_0_0.expo.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.SingletonModule;

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
