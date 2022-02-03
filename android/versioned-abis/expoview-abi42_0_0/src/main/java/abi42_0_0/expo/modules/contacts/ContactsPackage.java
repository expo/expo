
package abi42_0_0.expo.modules.contacts;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi42_0_0.org.unimodules.core.ExportedModule;
import abi42_0_0.org.unimodules.core.BasePackage;

public class ContactsPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new ContactsModule(context));
  }
}
