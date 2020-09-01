package abi39_0_0.expo.modules.network;

import android.content.Context;

import abi39_0_0.org.unimodules.core.BasePackage;
import abi39_0_0.org.unimodules.core.ExportedModule;

import java.util.Collections;
import java.util.List;

public class NetworkPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new NetworkModule(context));
  }
}
