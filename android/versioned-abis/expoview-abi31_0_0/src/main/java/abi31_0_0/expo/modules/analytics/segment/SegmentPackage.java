package abi31_0_0.expo.modules.analytics.segment;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi31_0_0.expo.core.BasePackage;
import abi31_0_0.expo.core.ExportedModule;

public class SegmentPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new SegmentModule(context));
  }
}
