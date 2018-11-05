package io.expo.testsuiteflutter;

import android.os.Bundle;

import io.expo.expoflutteradapter.ExpoFlutterAdapterPlugin;
import io.flutter.app.FlutterActivity;
import io.flutter.plugins.GeneratedPluginRegistrant;

public class MainActivity extends FlutterActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    GeneratedPluginRegistrant.registerWith(this);
    ExpoFlutterAdapterPlugin.initialize();
  }
}
