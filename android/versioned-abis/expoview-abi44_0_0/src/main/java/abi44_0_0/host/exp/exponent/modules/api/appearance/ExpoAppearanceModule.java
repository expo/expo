package abi44_0_0.host.exp.exponent.modules.api.appearance;

import android.content.res.Configuration;
import android.util.Log;

import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import abi44_0_0.host.exp.exponent.modules.api.appearance.rncappearance.RNCAppearanceModule;

public class ExpoAppearanceModule extends RNCAppearanceModule {
  public ExpoAppearanceModule(@NonNull ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  protected String getColorScheme(Configuration config) {
    if (getCurrentActivity() instanceof AppCompatActivity) {
      int mode = ((AppCompatActivity) getCurrentActivity()).getDelegate().getLocalNightMode();

      switch (mode) {
        case AppCompatDelegate.MODE_NIGHT_YES:
          return "dark";
        case AppCompatDelegate.MODE_NIGHT_NO:
          return "light";
        case AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY:
        case AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM:
        case AppCompatDelegate.MODE_NIGHT_UNSPECIFIED:
        default:
          // no scoped theme enforced -> fallback to bare scenario
          return super.getColorScheme(config);
      }
    }

    // shouldn't be reachable as `getCurrentActivity` should always return AppCompatActivity
    Log.d(ExpoAppearanceModule.class.getSimpleName(), "Appearance cannot be properly checked because of invalid Activity class.");
    return super.getColorScheme(config);
  }
}
