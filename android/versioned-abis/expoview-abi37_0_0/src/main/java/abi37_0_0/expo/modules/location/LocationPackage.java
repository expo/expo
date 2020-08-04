package abi37_0_0.expo.modules.location;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi37_0_0.org.unimodules.core.ExportedModule;
import abi37_0_0.org.unimodules.core.BasePackage;

public class LocationPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new LocationModule(context));
  }
}
