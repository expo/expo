
package abi37_0_0.expo.modules.sms;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi37_0_0.org.unimodules.core.BasePackage;
import abi37_0_0.org.unimodules.core.ExportedModule;
import abi37_0_0.org.unimodules.core.interfaces.InternalModule;

public class SMSPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new SMSModule(reactContext));
  }
}
