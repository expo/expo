
package expo.modules.random;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;
import expo.core.ViewManager;

public class RandomPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new RandomModule(context));
  }
}