package expo.modules.firebase.core;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;
import expo.modules.core.interfaces.InternalModule;

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
