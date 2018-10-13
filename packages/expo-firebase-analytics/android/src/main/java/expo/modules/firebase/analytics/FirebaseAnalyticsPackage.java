package expo.modules.firebase.analytics;

import android.content.Context;
import android.support.annotation.RequiresPermission;

import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;

public class FirebaseAnalyticsPackage extends BasePackage {

   @RequiresPermission(
     allOf = {"android.permission.INTERNET", "android.permission.ACCESS_NETWORK_STATE", "android.permission.WAKE_LOCK"}
   )
   public FirebaseAnalyticsPackage() {
   }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new FirebaseAnalyticsModule(context));
  }
}

