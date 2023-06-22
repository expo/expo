package abi49_0_0.expo.modules.securestore;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi49_0_0.expo.modules.core.BasePackage;
import abi49_0_0.expo.modules.core.ExportedModule;

public class SecureStorePackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new SecureStoreModule(context));
  }
}
