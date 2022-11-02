package abi47_0_0.expo.modules.av;

import android.content.Context;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi47_0_0.expo.modules.core.BasePackage;
import abi47_0_0.expo.modules.core.ExportedModule;
import abi47_0_0.expo.modules.core.ViewManager;
import abi47_0_0.expo.modules.core.interfaces.InternalModule;
import abi47_0_0.expo.modules.av.player.datasource.SharedCookiesDataSourceFactoryProvider;

public class AVPackage extends BasePackage {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Arrays.asList(
        new AVManager(context),
        new SharedCookiesDataSourceFactoryProvider()
    );
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Arrays.<ExportedModule>asList(
        new AVModule(context)
    );
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.emptyList();
  }
}
