package expo.modules.intentlauncher;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;

public class IntentLauncherPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new IntentLauncherModule(context));
  }
}
