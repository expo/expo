package expo.modules.contacts.flutter;

import expo.modules.contacts.ContactsPackage;
import io.expo.expoflutteradapter.ExpoFlutterAdapterPlugin;
import io.flutter.plugin.common.PluginRegistry.Registrar;

public class ExpoContactsFlutterPlugin {
  public static void registerWith(Registrar registrar) {
    ExpoFlutterAdapterPlugin.addPackage(new ContactsPackage());
  }
}