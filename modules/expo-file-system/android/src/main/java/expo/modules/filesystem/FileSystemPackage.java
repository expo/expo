
package expo.modules.filesystem;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.ExportedModule;
import expo.core.BasePackage;
import expo.core.Module;

public class FileSystemPackage extends BasePackage {
  @Override
  public List<Module> createModules() {
    return Collections.<Module>singletonList(new FileSystem());
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new FileSystemModule(context));
  }
}