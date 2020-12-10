package abi40_0_0.expo.modules.keepawake;

import android.content.Context;

import abi40_0_0.org.unimodules.core.ExportedModule;
import abi40_0_0.org.unimodules.core.interfaces.InternalModule;
import abi40_0_0.org.unimodules.core.interfaces.Package;

import java.util.Collections;
import java.util.List;

public class KeepAwakePackage implements Package {

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new KeepAwakeModule(context));
  }

  @Override
  public List<? extends InternalModule> createInternalModules(Context context) {
    return Collections.singletonList(new ExpoKeepAwakeManager());
  }
}
