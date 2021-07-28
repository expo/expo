package expo.modules.keepawake;

import android.content.Context;

import expo.modules.core.ExportedModule;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.Package;

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
