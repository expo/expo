package io.expo.exposensors;

import expo.modules.sensors.SensorsPackage;
import io.expo.expoflutteradapter.ExpoFlutterAdapterPlugin;
import io.flutter.plugin.common.PluginRegistry.Registrar;

/** ExpoSensorsPlugin */
public class ExpoSensorsPlugin  {
 public static void registerWith(Registrar registrar) {
    ExpoFlutterAdapterPlugin.addPackage(new SensorsPackage());
  }
}
