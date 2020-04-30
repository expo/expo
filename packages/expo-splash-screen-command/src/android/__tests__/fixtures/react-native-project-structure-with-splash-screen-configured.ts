export default {
  'android/app/src/main/java/com/reactnativeproject/MainActivity.java': `package com.reactnativeproject;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactRootView;

import expo.modules.splashscreen.SplashScreen;
import expo.modules.splashscreen.SplashScreenImageResizeMode;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // SplashScreen.show(...) has to be called after super.onCreate(...)
    // Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually
    SplashScreen.show(this, SplashScreenImageResizeMode.CONTAIN, ReactRootView.class);
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "react-native-project";
  }
}
`,
  'android/app/src/main/AndroidManifest.xml': `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.reactnativeproject">
  <uses-permission android:name="android.permission.INTERNET"/>
  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
  >
    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize"
      android:theme="@style/Theme.App.SplashScreen"
    >
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
    <activity android:name="com.facebook.react.devsupport.DevSettingsActivity"/>
  </application>
</manifest>
`,
  'android/app/src/main/res/drawable/splashscreen.xml': `<?xml version="1.0" encoding="utf-8"?>
<!--
  This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand
-->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
</layer-list>
`,
  'android/app/src/main/res/values/colors.xml': `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <!-- Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually -->
  <color name="splashscreen_background">#E3F29238</color>
</resources>
`,
  'android/app/src/main/res/values/styles.xml': `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <!-- Customize your theme here. -->
    <item name="android:textColor">#000000</item>
  </style>
  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar">
    <!-- Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually -->
    <item name="android:windowBackground">@drawable/splashscreen</item>
    <!-- Customize your splash screen theme here -->
  </style>
</resources>
`,
};
