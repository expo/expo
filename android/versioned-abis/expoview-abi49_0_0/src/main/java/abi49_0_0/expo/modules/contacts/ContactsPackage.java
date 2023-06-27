
package abi49_0_0.expo.modules.contacts;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi49_0_0.expo.modules.core.ExportedModule;
import abi49_0_0.expo.modules.core.BasePackage;

public class ContactsPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new ContactsModule(context));
  }
}
