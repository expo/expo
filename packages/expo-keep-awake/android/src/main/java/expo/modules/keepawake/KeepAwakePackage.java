package expo.modules.keepawake;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;
public class KeepAwakePackage extends BasePackage {

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new KeepAwakeModule(context));
  }
}
