// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;

import org.json.JSONObject;

public class ExperienceActivityUtils {

  private static final String TAG = ExperienceActivityUtils.class.getSimpleName();

  public static void updateOrientation(JSONObject manifest, Activity activity) {
    if (manifest == null) {
      return;
    }

    String orientation = manifest.optString(ExponentManifest.MANIFEST_ORIENTATION_KEY, null);
    if (orientation == null) {
      activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
      return;
    }

    switch (orientation) {
      case "default":
        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        break;
      case "portrait":
        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        break;
      case "landscape":
        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        break;
    }
  }

  // region user interface style - light/dark/automatic mode

  public static void overrideUserInterfaceStyle(JSONObject manifest, AppCompatActivity activity) {
    String userInterfaceStyle = readUserInterfaceStyleFromManifest(manifest);
    int mode = nightModeFromString(userInterfaceStyle);
    activity.getDelegate().setLocalNightMode(mode);
  }

  private static int nightModeFromString(@Nullable String userInterfaceStyle) {
    if (userInterfaceStyle == null) {
      return AppCompatDelegate.MODE_NIGHT_NO;
    }
    switch (userInterfaceStyle) {
      case "automatic":
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
          return AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY;
        }
        return AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM;
      case "dark":
        return AppCompatDelegate.MODE_NIGHT_YES;
      case "light":
      default:
        return AppCompatDelegate.MODE_NIGHT_NO;
    }
  }

  @Nullable
  private static String readUserInterfaceStyleFromManifest(JSONObject manifest) {
    if (manifest.optJSONObject("android").has("userInterfaceStyle")) {
      return manifest.optJSONObject("android").optString("userInterfaceStyle");
    }
    return manifest.optString("userInterfaceStyle", "light");
  }

  // endregion


  public static void setWindowTransparency(final String sdkVersion, final JSONObject manifest, final Activity activity) {
    JSONObject statusBarOptions = manifest.optJSONObject(ExponentManifest.MANIFEST_STATUS_BAR_KEY);

    String statusBarColor;

    if (statusBarOptions != null) {
      statusBarColor = statusBarOptions.optString(ExponentManifest.MANIFEST_STATUS_BAR_BACKGROUND_COLOR);
    } else {
      statusBarColor = manifest.optString(ExponentManifest.MANIFEST_STATUS_BAR_COLOR);
    }

    if (statusBarColor != null && ColorParser.isValid(statusBarColor)) {
      try {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        activity.getWindow().setStatusBarColor(Color.parseColor(statusBarColor));
      } catch (Throwable e) {
        EXL.e(TAG, e);
      }
    }

    if (statusBarOptions == null) {
      return;
    }

    String statusBarAppearance = statusBarOptions.optString(ExponentManifest.MANIFEST_STATUS_BAR_APPEARANCE);

    if (statusBarAppearance != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      try {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        if (statusBarAppearance.equals("dark-content")) {
          activity.getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
      } catch (Throwable e) {
        EXL.e(TAG, e);
      }
    }
  }

  public static void setTaskDescription(final ExponentManifest exponentManifest, final JSONObject manifest, final Activity activity) {
    final String iconUrl = manifest.optString(ExponentManifest.MANIFEST_ICON_URL_KEY);
    final int color = exponentManifest.getColorFromManifest(manifest);

    exponentManifest.loadIconBitmap(iconUrl, new ExponentManifest.BitmapListener() {
      @Override
      public void onLoadBitmap(Bitmap bitmap) {
        // This if statement is only needed so the compiler doesn't show an error.
        try {
          activity.setTaskDescription(new ActivityManager.TaskDescription(
              manifest.optString(ExponentManifest.MANIFEST_NAME_KEY),
              bitmap,
              color
          ));
        } catch (Throwable e) {
          EXL.e(TAG, e);
        }
      }
    });
  }

  public static void setNavigationBar(final JSONObject manifest, final Activity activity) {
    JSONObject navBarOptions = manifest.optJSONObject(ExponentManifest.MANIFEST_NAVIGATION_BAR_KEY);
    if (navBarOptions == null) {
      return;
    }

    String navBarColor = navBarOptions.optString(ExponentManifest.MANIFEST_NAVIGATION_BAR_BACKGROUND_COLOR);

    // Set background color of navigation bar
    if (navBarColor != null && ColorParser.isValid(navBarColor)) {
      try {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        activity.getWindow().setNavigationBarColor(Color.parseColor(navBarColor));
      } catch (Throwable e) {
        EXL.e(TAG, e);
      }
    }

    // Set icon color of navigation bar
    String navBarAppearance = navBarOptions.optString(ExponentManifest.MANIFEST_NAVIGATION_BAR_APPEARANCE);
    if (navBarAppearance != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        if (navBarAppearance.equals("dark-content")) {
          View decorView = activity.getWindow().getDecorView();
          int flags = decorView.getSystemUiVisibility();
          flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
          decorView.setSystemUiVisibility(flags);
        }
      } catch (Throwable e) {
        EXL.e(TAG, e);
      }
    }

    // Set visibility of navigation bar
    if (navBarOptions.has(ExponentManifest.MANIFEST_NAVIGATION_BAR_VISIBLILITY)) {
      Boolean visible = navBarOptions.optBoolean(ExponentManifest.MANIFEST_NAVIGATION_BAR_VISIBLILITY);
      if (!visible) {
        // Hide both the navigation bar and the status bar. The Android docs recommend, "you should
        // design your app to hide the status bar whenever you hide the navigation bar."
        View decorView = activity.getWindow().getDecorView();
        int flags = decorView.getSystemUiVisibility();
        flags |= (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN);
        decorView.setSystemUiVisibility(flags);
      }
    }
  }
}
