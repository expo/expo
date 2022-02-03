package abi43_0_0.expo.modules.facebook;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi43_0_0.expo.modules.core.BasePackage;
import abi43_0_0.expo.modules.core.ExportedModule;

public class FacebookPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new FacebookModule(context));
  }
}
