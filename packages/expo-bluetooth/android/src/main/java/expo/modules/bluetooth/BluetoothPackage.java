package expo.modules.bluetooth;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;

public class BluetoothPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.<ExportedModule>singletonList(new BluetoothModule(context));
  }
}