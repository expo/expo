package dev.expo.payments;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;

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
  protected ReactActivityDelegate createReactActivityDelegate() {
    Activity activity = this;
    ReactActivityDelegate delegate = new ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      new ReactActivityDelegate(this, getMainComponentName()) {
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

    return delegate;
  }
}
