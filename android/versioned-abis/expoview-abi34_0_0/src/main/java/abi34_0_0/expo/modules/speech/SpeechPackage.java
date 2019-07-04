package abi34_0_0.expo.modules.speech;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi34_0_0.org.unimodules.core.BasePackage;
import abi34_0_0.org.unimodules.core.ExportedModule;

public class SpeechPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new SpeechModule(reactContext));
  }
}
