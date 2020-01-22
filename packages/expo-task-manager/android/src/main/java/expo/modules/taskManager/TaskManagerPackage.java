package expo.modules.taskManager;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.BasePackage;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.SingletonModule;

import expo.loaders.provider.AppLoaderProvider;
import expo.modules.taskManager.apploader.RNHeadlessAppStarter;

public class TaskManagerPackage extends BasePackage {

  static {
    AppLoaderProvider.registerLoader("react-native-experience", RNHeadlessAppStarter.class);
  }

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
