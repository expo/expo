package expo.modules.developmentclient.barcodescanner;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.developmentclient.unimodules.core.BasePackage;
import expo.modules.developmentclient.unimodules.core.ExportedModule;
import expo.modules.developmentclient.unimodules.core.ViewManager;
import expo.modules.developmentclient.unimodules.core.interfaces.InternalModule;

public class BarCodeScannerPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new BarCodeScannerProvider());
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new BarCodeScannerModule(context));
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.singletonList((ViewManager) new BarCodeScannerViewManager());
  }
}
