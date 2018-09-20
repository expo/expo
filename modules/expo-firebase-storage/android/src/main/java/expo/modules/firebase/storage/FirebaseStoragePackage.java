package expo.modules.firebase.storage;

import android.content.Context;
import android.support.annotation.RequiresPermission;
import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;

@SuppressWarnings("unused")
public class FirebaseStoragePackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new FirebaseStorageModule(context));
  }
}
