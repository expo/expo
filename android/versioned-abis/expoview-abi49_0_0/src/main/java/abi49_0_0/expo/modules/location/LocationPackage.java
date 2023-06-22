package abi49_0_0.expo.modules.location;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi49_0_0.expo.modules.core.ExportedModule;
import abi49_0_0.expo.modules.core.BasePackage;

public class LocationPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new LocationModule(context));
  }
}
