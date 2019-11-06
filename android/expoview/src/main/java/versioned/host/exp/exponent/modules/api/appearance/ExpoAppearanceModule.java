package versioned.host.exp.exponent.modules.api.appearance;

import android.content.res.Configuration;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.ReactConstants;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;

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
    FLog.d(ReactConstants.TAG, "Appearance cannot be properly checked because of invalid Activity class.");
    return super.getColorScheme(config);
  }
}
