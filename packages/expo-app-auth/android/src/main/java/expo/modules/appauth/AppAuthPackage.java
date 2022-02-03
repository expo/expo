package expo.modules.appauth;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;

public class AppAuthPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new AppAuthModule(context));
  }
}
