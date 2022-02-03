package abi43_0_0.expo.modules.network;

import android.content.Context;

import abi43_0_0.expo.modules.core.BasePackage;
import abi43_0_0.expo.modules.core.ExportedModule;

import java.util.Collections;
import java.util.List;

public class NetworkPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new NetworkModule(context));
  }
}
