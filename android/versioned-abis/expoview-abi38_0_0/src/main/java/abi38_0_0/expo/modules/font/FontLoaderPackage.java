package abi38_0_0.expo.modules.font;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi38_0_0.org.unimodules.core.BasePackage;
import abi38_0_0.org.unimodules.core.ExportedModule;

public class FontLoaderPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new FontLoaderModule(context));
  }
}
