// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;

import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.view.ViewCompat;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;

import org.json.JSONException;
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
    if (manifest.has("android") && manifest.optJSONObject("android").has("userInterfaceStyle")) {
      return manifest.optJSONObject("android").optString("userInterfaceStyle");
    }
    return manifest.optString("userInterfaceStyle", "light");
  }

  // endregion

  // region StatusBar configuration

  /**
   * React Native is not using flag {@link WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS} nor view/manifest attribute 'android:windowTranslucentStatus'
   * (https://developer.android.com/reference/android/view/WindowManager.LayoutParams.html#FLAG_TRANSLUCENT_STATUS)
   * (https://developer.android.com/reference/android/R.attr.html#windowTranslucentStatus)
   *
   * Instead it's using {@link WindowInsets} to limit available space on the screen ({@link com.facebook.react.modules.statusbar.StatusBarModule#setTranslucent(boolean)}).
   *
   * We're using android:windowTranslucentStatus in our theme to enforce translucency during native SplashScreen period (because it's iOS default behaviour).
   * Therefore we need to adjust our approach to align with RN to ensure {@link com.facebook.react.modules.statusbar.StatusBarModule} works.
   */
  public static void configureStatusBar(final JSONObject manifest, final Activity activity) {
    @Nullable JSONObject statusBarOptions = manifest.optJSONObject(ExponentManifest.MANIFEST_STATUS_BAR_KEY);

    @Nullable String statusBarStyle = statusBarOptions != null ? statusBarOptions.optString(ExponentManifest.MANIFEST_STATUS_BAR_APPEARANCE) : null;
    @Nullable String statusBarBackgroundColor = statusBarOptions != null ? statusBarOptions.optString(ExponentManifest.MANIFEST_STATUS_BAR_BACKGROUND_COLOR) : null;

    // if statusBarColor isn't set -> statusBar has to be transparent
    boolean statusBarTranslucent = statusBarBackgroundColor == null;

    activity.runOnUiThread(() -> {
      // clear android:windowTranslucentStatus flag
      activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);

      setTranslucent(statusBarTranslucent, activity);

      // if statusBar is translucent it has to have transparent color as well
      if (statusBarTranslucent) {
        setColor(Color.TRANSPARENT, activity);
      } else if (ColorParser.isValid(statusBarBackgroundColor)) {
        setColor(Color.parseColor(statusBarBackgroundColor), activity);
      }

      if (statusBarStyle != null) {
        setStyle(statusBarStyle, activity);
      }
    });
  }

  @UiThread
  public static void setColor(final int color, final Activity activity) {
    activity
        .getWindow()
        .addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
    activity
        .getWindow()
        .setStatusBarColor(color);
  }

  @UiThread
  public static void setTranslucent(final boolean translucent, final Activity activity) {
    // If the status bar is translucent hook into the window insets calculations
    // and consume all the top insets so no padding will be added under the status bar.
    View decorView = activity.getWindow().getDecorView();
    if (translucent) {
      decorView.setOnApplyWindowInsetsListener(
          (v, insets) -> {
            WindowInsets defaultInsets = v.onApplyWindowInsets(insets);
            return defaultInsets.replaceSystemWindowInsets(
                defaultInsets.getSystemWindowInsetLeft(),
                0,
                defaultInsets.getSystemWindowInsetRight(),
                defaultInsets.getSystemWindowInsetBottom());
          });
    } else {
      decorView.setOnApplyWindowInsetsListener(null);
    }

    ViewCompat.requestApplyInsets(decorView);
  }

  @UiThread
  private static void setStyle(final String style, final Activity activity) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      View decorView = activity.getWindow().getDecorView();
      int systemUiVisibilityFlags = decorView.getSystemUiVisibility();
      if ("dark-content".equals(style)) {
        systemUiVisibilityFlags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      } else {
        systemUiVisibilityFlags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      }
      decorView.setSystemUiVisibility(systemUiVisibilityFlags);
    }
  }

  // endregion

  public static void setTaskDescription ( final ExponentManifest exponentManifest,
    final JSONObject manifest, final Activity activity){
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

    public static void setNavigationBar ( final JSONObject manifest, final Activity activity){
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

    public static void setRootViewBackgroundColor ( final JSONObject manifest, final View rootView){
      String colorString;

      try {
        colorString = manifest.
            getJSONObject(ExponentManifest.MANIFEST_ANDROID_INFO_KEY).
            getString(ExponentManifest.MANIFEST_BACKGROUND_COLOR_KEY);
      } catch (JSONException e) {
        colorString = manifest.optString(ExponentManifest.MANIFEST_BACKGROUND_COLOR_KEY);
      }

      if (colorString == null) {
        colorString = "#ffffff";
      }

      try {
        int color = Color.parseColor(colorString);
        rootView.setBackgroundColor(color);
      } catch (Throwable e) {
        EXL.e(TAG, e);
        rootView.setBackgroundColor(Color.WHITE);
      }
    }
  }
