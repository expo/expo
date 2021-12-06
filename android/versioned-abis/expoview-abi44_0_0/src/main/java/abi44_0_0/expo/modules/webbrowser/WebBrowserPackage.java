package abi44_0_0.expo.modules.webbrowser;

import android.content.Context;

import abi44_0_0.expo.modules.core.BasePackage;
import abi44_0_0.expo.modules.core.ExportedModule;
import abi44_0_0.expo.modules.core.interfaces.InternalModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class WebBrowserPackage extends BasePackage {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    List<InternalModule> list = new ArrayList<>();
    list.add(new InternalCustomTabsActivitiesHelper());
    list.add(new InternalCustomTabsConnectionHelper(context));
    return list;
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList(new WebBrowserModule(context));
  }
}
