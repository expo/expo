package abi47_0_0.expo.modules.firebase.analytics;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi47_0_0.expo.modules.core.BasePackage;
import abi47_0_0.expo.modules.core.ExportedModule;

public class FirebaseAnalyticsPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new FirebaseAnalyticsModule(context));
  }
}

