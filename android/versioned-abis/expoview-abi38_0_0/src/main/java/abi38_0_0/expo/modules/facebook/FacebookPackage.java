package abi38_0_0.expo.modules.facebook;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi38_0_0.org.unimodules.core.BasePackage;
import abi38_0_0.org.unimodules.core.ExportedModule;

public class FacebookPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new FacebookModule(context));
  }
}
