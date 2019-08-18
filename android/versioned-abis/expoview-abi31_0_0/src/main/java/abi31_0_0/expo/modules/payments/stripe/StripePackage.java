package abi31_0_0.expo.modules.payments.stripe;



import android.content.Context;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi31_0_0.expo.core.BasePackage;
import abi31_0_0.expo.core.ExportedModule;
import abi31_0_0.expo.core.ViewManager;

public class StripePackage extends BasePackage {

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Arrays.<ExportedModule>asList(new StripeModule(context));
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.emptyList();
  }
}
