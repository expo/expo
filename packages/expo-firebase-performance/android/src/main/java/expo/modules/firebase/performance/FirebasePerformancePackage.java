package expo.modules.firebase.performance;

import android.content.Context;
import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;

public class FirebasePerformancePackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new FirebasePerformanceModule(context));
  }
}


