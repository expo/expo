package expo.modules.sensors.flutter;

import expo.modules.sensors.SensorsPackage;
import io.expo.expoflutteradapter.ExpoFlutterAdapterPlugin;
import io.flutter.plugin.common.PluginRegistry.Registrar;

public class ExpoSensorsFlutterPlugin {
  public static void registerWith(Registrar registrar) {
    ExpoFlutterAdapterPlugin.addPackage(new SensorsPackage());
  }
}
