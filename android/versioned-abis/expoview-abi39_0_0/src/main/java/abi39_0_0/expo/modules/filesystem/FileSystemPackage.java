package abi39_0_0.expo.modules.filesystem;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi39_0_0.org.unimodules.core.ExportedModule;
import abi39_0_0.org.unimodules.core.BasePackage;
import abi39_0_0.org.unimodules.core.interfaces.InternalModule;

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
