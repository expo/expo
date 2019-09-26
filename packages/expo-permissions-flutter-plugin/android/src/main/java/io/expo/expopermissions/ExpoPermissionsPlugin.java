package io.expo.expopermissions;

import expo.modules.permissions.PermissionsPackage;
import io.expo.expoflutteradapter.ExpoFlutterAdapterPlugin;
import io.flutter.plugin.common.PluginRegistry.Registrar;

/** ExpoPermissionsPlugin */
public class ExpoPermissionsPlugin {
 public static void registerWith(Registrar registrar) {
    ExpoFlutterAdapterPlugin.addPackage(new PermissionsPackage());
  }
}
