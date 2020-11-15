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

import org.json.JSONException;
import org.json.JSONObject;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.view.ViewCompat;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.expoview.R;

public class ExperienceActivityUtils {

  private static final String TAG = ExperienceActivityUtils.class.getSimpleName();
  private static final String STATUS_BAR_STYLE_DARK_CONTENT = "dark-content";
  private static final String STATUS_BAR_STYLE_LIGHT_CONTENT = "light-content";

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

  public static void updateSoftwareKeyboardLayoutMode(JSONObject manifest, Activity activity) {
    if (manifest == null) {
      return;
    }

    String keyboardLayoutMode = readSoftwareKeyboardLayoutModeFromManifest(manifest);

    // It's only necessary to set this manually for pan, resize is the default for the activity.
    if (keyboardLayoutMode.equals("pan")) {
      activity.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
    }
  }

  @Nullable
  private static String readSoftwareKeyboardLayoutModeFromManifest(JSONObject manifest) {
    if (manifest.has(ExponentManifest.MANIFEST_ANDROID_INFO_KEY) && manifest.optJSONObject(ExponentManifest.MANIFEST_ANDROID_INFO_KEY).has(ExponentManifest.MANIFEST_KEYBOARD_LAYOUT_MODE_KEY)) {
      return manifest.optJSONObject(ExponentManifest.MANIFEST_ANDROID_INFO_KEY).optString(ExponentManifest.MANIFEST_KEYBOARD_LAYOUT_MODE_KEY, "resize");
    }
    return "resize";
  }

  // region user interface style - light/dark/automatic mode


  /**
   * @deprecated Do not use in SDK38 and above! Use {@link ExperienceActivityUtils#overrideUiMode(JSONObject, AppCompatActivity)} instead.
   * Returns true if activity will be reloaded after night mode change.
   * Otherwise returns false.
   **/
  @Deprecated
  public static boolean overrideUserInterfaceStyle(JSONObject manifest, AppCompatActivity activity) {
    String userInterfaceStyle = readUserInterfaceStyleFromManifest(manifest);
    int mode = nightModeFromString(userInterfaceStyle);
    boolean isNightModeCurrentlyOn = activity.getResources().getBoolean(R.bool.dark_mode);
    boolean willBeReloaded = false;
    if (mode != AppCompatDelegate.MODE_NIGHT_AUTO) {
      willBeReloaded = isNightModeCurrentlyOn && mode == AppCompatDelegate.MODE_NIGHT_NO
        || !isNightModeCurrentlyOn && mode == AppCompatDelegate.MODE_NIGHT_YES;
    }

    activity.getDelegate().setLocalNightMode(mode);
    return willBeReloaded;
  }

  /**
   * Sets uiMode to according to what is being set in manifest.
   **/
  public static void overrideUiMode(JSONObject manifest, AppCompatActivity activity) {
    String userInterfaceStyle = readUserInterfaceStyleFromManifest(manifest);
    activity.getDelegate().setLocalNightMode(nightModeFromString(userInterfaceStyle));
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
   * Instead it's using {@link WindowInsets} to limit available space on the screen ({@link com.facebook.react.modules.statusbar.StatusBarModule#setTranslucent(boolean)}).
   * <p>
   * In case 'android:'windowTranslucentStatus' is used in activity's theme, it has to be removed in order to make RN's Status Bar API work.
   * Out approach to achieve translucency of StatusBar has to be aligned with RN's approach to ensure {@link com.facebook.react.modules.statusbar.StatusBarModule} works.
   * <p>
   * Links to follow in case of need of more detailed understating.
   * https://chris.banes.dev/talks/2017/becoming-a-master-window-fitter-lon/
   * https://www.youtube.com/watch?v=_mGDMVRO3iE
   */
  public static void configureStatusBar(@NonNull JSONObject manifest, final Activity activity) {
    @Nullable JSONObject statusBarOptions = manifest.optJSONObject(ExponentManifest.MANIFEST_STATUS_BAR_KEY);
    @Nullable String statusBarStyle = statusBarOptions != null ? statusBarOptions.optString(ExponentManifest.MANIFEST_STATUS_BAR_APPEARANCE) : null;
    @Nullable String statusBarBackgroundColor = statusBarOptions != null ? statusBarOptions.optString(ExponentManifest.MANIFEST_STATUS_BAR_BACKGROUND_COLOR, null) : null;

    String sdkVersion = manifest.optString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);
    boolean statusBarHidden = statusBarOptions != null && statusBarOptions.optBoolean(ExponentManifest.MANIFEST_STATUS_BAR_HIDDEN, false);
    boolean statusBarTranslucent = statusBarOptions == null || statusBarOptions.optBoolean(ExponentManifest.MANIFEST_STATUS_BAR_TRANSLUCENT, true);

    activity.runOnUiThread(() -> {
      // clear android:windowTranslucentStatus flag from Window as RN achieves translucency using WindowInsets
      activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);

      setHidden(statusBarHidden, activity);

      setTranslucent(statusBarTranslucent, activity);

      String appliedStatusBarStyle = setStyle(statusBarStyle, activity, sdkVersion);

      // Color passed from manifest is in format '#RRGGBB(AA)' and Android uses '#AARRGGBB'
      String normalizedStatusBarBackgroundColor = RGBAtoARGB(statusBarBackgroundColor);

      if (normalizedStatusBarBackgroundColor == null || !ColorParser.isValid(normalizedStatusBarBackgroundColor)) {
        // backgroundColor is invalid or not set
        if (appliedStatusBarStyle.equals(STATUS_BAR_STYLE_LIGHT_CONTENT)) {
          // appliedStatusBarStyle is "light-content" so background color should be semi transparent black
          setColor(Color.parseColor("#88000000"), activity);
        } else {
          // otherwise it has to be transparent
          setColor(Color.TRANSPARENT, activity);
        }
      } else {
        setColor(Color.parseColor(normalizedStatusBarBackgroundColor), activity);
      }
    });
  }

  /**
   * If the string conforms to the "#RRGGBBAA" format then it's converted into the "#AARRGGBB" format.
   * Otherwise noop.
   */
  private static String RGBAtoARGB(@Nullable String rgba) {
    if (rgba == null) {
      return null;
    }
    if (rgba.startsWith("#") && rgba.length() == 9) {
      return "#" + rgba.substring(7, 9) + rgba.substring(1, 7);
    }
    return rgba;
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

  /**
   * @return Effective style that is actually applied to the status bar.
   */
  @UiThread
  private static String setStyle(@Nullable final String style, final Activity activity, String sdkVersion) {
    String appliedStatusBarStyle = STATUS_BAR_STYLE_LIGHT_CONTENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      View decorView = activity.getWindow().getDecorView();
      int systemUiVisibilityFlags = decorView.getSystemUiVisibility();
      switch (style != null ? style : "") {
        case STATUS_BAR_STYLE_LIGHT_CONTENT:
          systemUiVisibilityFlags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
          appliedStatusBarStyle = STATUS_BAR_STYLE_LIGHT_CONTENT;
          break;
        case STATUS_BAR_STYLE_DARK_CONTENT:
          systemUiVisibilityFlags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
          appliedStatusBarStyle = STATUS_BAR_STYLE_DARK_CONTENT;
          break;
        default:
          systemUiVisibilityFlags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
          appliedStatusBarStyle = STATUS_BAR_STYLE_DARK_CONTENT;
          break;
      }
      decorView.setSystemUiVisibility(systemUiVisibilityFlags);
    }
    return appliedStatusBarStyle;
  }

  @UiThread
  private static void setHidden(final boolean hidden, final Activity activity) {
    if (hidden) {
      activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
      activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
    } else {
      activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
      activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
    }
  }

  // endregion

  public static void setTaskDescription(final ExponentManifest exponentManifest,
                                        final JSONObject manifest, final Activity activity) {
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

    // Set background color of navigation bar
    String navBarColor = navBarOptions.optString(ExponentManifest.MANIFEST_NAVIGATION_BAR_BACKGROUND_COLOR);
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
    String navBarVisible = navBarOptions.optString(ExponentManifest.MANIFEST_NAVIGATION_BAR_VISIBLILITY);
    if (navBarVisible != null) {
      // Hide both the navigation bar and the status bar. The Android docs recommend, "you should
      // design your app to hide the status bar whenever you hide the navigation bar."
      View decorView = activity.getWindow().getDecorView();
      int flags = decorView.getSystemUiVisibility();

      switch (navBarVisible) {
        case "leanback":
          flags |= (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN);
          break;
        case "immersive":
          flags |= (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE);
          break;
        case "sticky-immersive":
          flags |= (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
          break;
      }

      decorView.setSystemUiVisibility(flags);
    }
  }


  public static void setRootViewBackgroundColor(final JSONObject manifest, final View rootView) {
    String colorString;

    try {
      colorString = manifest.
        getJSONObject(ExponentManifest.MANIFEST_ANDROID_INFO_KEY).
        getString(ExponentManifest.MANIFEST_BACKGROUND_COLOR_KEY);
    } catch (JSONException e) {
      colorString = manifest.optString(ExponentManifest.MANIFEST_BACKGROUND_COLOR_KEY);
    }

    if (colorString == null || !ColorParser.isValid(colorString)) {
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
