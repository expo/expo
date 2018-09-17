package expo.modules.firebase.storage;

import android.content.Context;
import android.support.annotation.RequiresPermission;
import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;

@SuppressWarnings("unused")
public class FirebaseStoragePackage extends BasePackage {
//  @RequiresPermission(
//    allOf = {"android.permission.INTERNET", "android.permission.ACCESS_NETWORK_STATE", "android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE"}
//  )
//  public RNFirebaseStoragePackage() {
//  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new FirebaseStorageModule(context));
  }
}
