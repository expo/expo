package expo.modules.firebase.storage;

import android.content.Context;
import android.support.annotation.RequiresPermission;
import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;

public class FirebaseStoragePackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new FirebaseStorageModule(context));
  }
}
