package expo.modules.permissions.flutter;

import expo.modules.permissions.PermissionsPackage;
import io.expo.expoflutteradapter.ExpoFlutterAdapterPlugin;
import io.flutter.plugin.common.PluginRegistry.Registrar;

public class ExpoPermissionsFlutterPlugin {
  public static void registerWith(Registrar registrar) {
    ExpoFlutterAdapterPlugin.addPackage(new PermissionsPackage());
  }
}
