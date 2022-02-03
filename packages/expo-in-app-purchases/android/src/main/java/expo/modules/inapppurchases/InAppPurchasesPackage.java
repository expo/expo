package expo.modules.inapppurchases;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;

public class InAppPurchasesPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new InAppPurchasesModule(context));
  }
}
