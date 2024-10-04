package expo.modules.gl;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.ExportedModule;
import expo.modules.core.BasePackage;

public class GLPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new GLObjectManagerModule(context));
  }
}
