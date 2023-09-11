package dev.expo.payments;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;


import expo.modules.ReactActivityDelegateWrapper;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "main";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
    // https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
    super.onCreate(null);
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled()) {

      @Override
      protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Hacky way to prevent onboarding DevMenuActivity breaks detox testing,
        // we do this by setting the dev-menu internal setting.
        final Intent intent = getIntent();
        final String action = intent.getAction();
        final Uri initialUri = intent.getData();
        if (action.equals(Intent.ACTION_VIEW) &&
          initialUri != null &&
          initialUri.getHost().equals("test-suite")) {
          final String devMenuPrefKey = "expo.modules.devmenu.sharedpreferences";
          final SharedPreferences pref = getApplicationContext().getSharedPreferences(devMenuPrefKey, MODE_PRIVATE);
          pref.edit().putBoolean("isOnboardingFinished", true).apply();
        }
      }
    });
  }
}
