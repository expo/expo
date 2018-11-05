
package expo.modules.sms;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;
import expo.core.interfaces.InternalModule;

public class SMSPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new SMSModule(reactContext));
  }
}