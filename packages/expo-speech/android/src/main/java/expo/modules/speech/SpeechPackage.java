package expo.modules.speech;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;

public class SpeechPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new SpeechModule(reactContext));
  }
}
