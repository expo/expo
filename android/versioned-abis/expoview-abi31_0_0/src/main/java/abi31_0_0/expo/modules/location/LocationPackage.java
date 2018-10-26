package abi31_0_0.expo.modules.location;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi31_0_0.expo.core.ExportedModule;
import abi31_0_0.expo.core.BasePackage;

public class LocationPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new LocationModule(context));
  }
}
