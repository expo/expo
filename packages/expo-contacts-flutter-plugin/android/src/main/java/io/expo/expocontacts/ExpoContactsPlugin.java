package io.expo.expocontacts;

import expo.modules.contacts.ContactsPackage;
import io.expo.expoflutteradapter.ExpoFlutterAdapterPlugin;
import io.flutter.plugin.common.PluginRegistry.Registrar;

public class ExpoContactsPlugin  {
  public static void registerWith(Registrar registrar) {
    ExpoFlutterAdapterPlugin.addPackage(new ContactsPackage());
  }
}
