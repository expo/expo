package abi42_0_0.expo.modules.firebase.core;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi42_0_0.org.unimodules.core.BasePackage;
import abi42_0_0.org.unimodules.core.ExportedModule;
import abi42_0_0.org.unimodules.core.interfaces.InternalModule;

public class FirebaseCorePackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new FirebaseCoreService(context));
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new FirebaseCoreModule(context));
  }
}
