package expo.modules.firebase.functions;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;

@SuppressWarnings("unused")
public class FirebaseFunctionsPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new FirebaseFunctionsModule(context));
  }
}

