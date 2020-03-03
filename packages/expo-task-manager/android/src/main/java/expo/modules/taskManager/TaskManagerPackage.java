package expo.modules.taskManager;

import android.content.Context;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.SingletonModule;

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
