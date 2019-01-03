package abi32_0_0.expo.modules.medialibrary;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi32_0_0.expo.core.BasePackage;
import abi32_0_0.expo.core.ExportedModule;

public class MediaLibraryPackage extends BasePackage {

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new MediaLibraryModule(context));
  }
}
