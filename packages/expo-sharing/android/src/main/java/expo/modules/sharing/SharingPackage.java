package expo.modules.sharing;

import android.content.Context;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;

import java.util.Collections;
import java.util.List;

public class SharingPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new SharingModule(context));
  }
}
