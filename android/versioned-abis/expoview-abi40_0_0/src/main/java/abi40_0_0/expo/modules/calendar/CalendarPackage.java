package abi40_0_0.expo.modules.calendar;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi40_0_0.org.unimodules.core.BasePackage;
import abi40_0_0.org.unimodules.core.ExportedModule;

public class CalendarPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new CalendarModule(context));
  }
}
