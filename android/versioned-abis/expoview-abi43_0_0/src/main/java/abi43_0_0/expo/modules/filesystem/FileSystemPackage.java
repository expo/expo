package abi43_0_0.expo.modules.filesystem;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi43_0_0.expo.modules.core.ExportedModule;
import abi43_0_0.expo.modules.core.BasePackage;
import abi43_0_0.expo.modules.core.interfaces.InternalModule;

public class FileSystemPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.<InternalModule>singletonList(new FilePermissionModule());
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new FileSystemModule(context));
  }
}
