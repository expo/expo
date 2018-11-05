package expo.modules.location;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.ExportedModule;
import expo.core.BasePackage;

public class LocationPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new LocationModule(context));
  }
}
