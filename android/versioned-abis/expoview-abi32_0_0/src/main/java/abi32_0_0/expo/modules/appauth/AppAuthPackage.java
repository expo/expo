package abi32_0_0.expo.modules.appauth;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi32_0_0.expo.core.BasePackage;
import abi32_0_0.expo.core.ExportedModule;

public class AppAuthPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new AppAuthModule(context));
  }
}
