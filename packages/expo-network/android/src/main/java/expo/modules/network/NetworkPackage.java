package expo.modules.network;

import android.content.Context;

import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;

import java.util.Collections;
import java.util.List;

public class NetworkPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new NetworkModule(context));
  }
}
