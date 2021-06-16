package abi42_0_0.expo.modules.medialibrary;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi42_0_0.org.unimodules.core.BasePackage;
import abi42_0_0.org.unimodules.core.ExportedModule;

public class MediaLibraryPackage extends BasePackage {

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new MediaLibraryModule(context));
  }
}
