package abi48_0_0.expo.modules.backgroundfetch;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi48_0_0.expo.modules.core.BasePackage;
import abi48_0_0.expo.modules.core.ExportedModule;

public class BackgroundFetchPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new BackgroundFetchModule(context));
  }
}
