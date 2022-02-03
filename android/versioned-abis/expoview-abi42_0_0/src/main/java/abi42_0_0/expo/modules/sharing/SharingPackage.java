package abi42_0_0.expo.modules.sharing;

import android.content.Context;

import abi42_0_0.org.unimodules.core.BasePackage;
import abi42_0_0.org.unimodules.core.ExportedModule;

import java.util.Collections;
import java.util.List;

public class SharingPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new SharingModule(context));
  }
}
