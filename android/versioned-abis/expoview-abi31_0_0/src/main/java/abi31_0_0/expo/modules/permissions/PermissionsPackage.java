package abi31_0_0.expo.modules.permissions;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi31_0_0.expo.core.BasePackage;
import abi31_0_0.expo.core.ExportedModule;
import abi31_0_0.expo.core.interfaces.InternalModule;

public class PermissionsPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.<InternalModule>singletonList(new PermissionsService(context));
  }

  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new PermissionsModule(reactContext));
  }
}
