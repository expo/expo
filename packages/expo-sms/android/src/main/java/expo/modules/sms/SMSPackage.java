
package expo.modules.sms;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.interfaces.InternalModule;

public class SMSPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new SMSModule(reactContext));
  }
}
