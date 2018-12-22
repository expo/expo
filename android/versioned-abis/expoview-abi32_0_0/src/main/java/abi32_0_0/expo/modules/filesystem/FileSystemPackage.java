
package abi32_0_0.expo.modules.filesystem;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi32_0_0.expo.core.ExportedModule;
import abi32_0_0.expo.core.BasePackage;
import abi32_0_0.expo.core.interfaces.InternalModule;

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
