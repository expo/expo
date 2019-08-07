// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.app.ActionBar;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;

import host.exp.exponent.ABIVersion;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;

import org.json.JSONObject;

public class ExperienceActivityUtils {

  private static final String TAG = ExperienceActivityUtils.class.getSimpleName();
  private static JSONObject mStatusBar;

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

  public static void setWindowTransparency(final String sdkVersion, final JSONObject manifest, final Activity activity) {
    JSONObject statusBarOptions = manifest.optJSONObject(ExponentManifest.MANIFEST_STATUS_BAR_KEY);

    String statusBarColor;

    //always show status bar
    activity.getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);

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
          int flags = activity.getWindow().getDecorView().getSystemUiVisibility();
          flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
          activity.getWindow().getDecorView().setSystemUiVisibility(flags);
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

  public static boolean hasStatusBarInSplash(final JSONObject manifest) {
    JSONObject splash = null;
    boolean hasStatusBarInSplash = false;
    if (manifest.has("android")) {
      final JSONObject android = manifest.optJSONObject("android");
      if (android.has(ExponentManifest.MANIFEST_SPLASH_INFO_KEY)) {
        splash = android.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY);
        if (splash.has(ExponentManifest.MANIFEST_SPLASH_STATUS_BAR)) {
          mStatusBar = splash.optJSONObject(ExponentManifest.MANIFEST_SPLASH_STATUS_BAR);
          hasStatusBarInSplash = true;
        }
      }
    }
    return hasStatusBarInSplash;
  }

  public static void setStatusBarInSplash(final JSONObject manifest, final Activity activity) {
    String statusBarColor;

    if (mStatusBar != null) {
      statusBarColor = mStatusBar.optString(ExponentManifest.MANIFEST_STATUS_BAR_BACKGROUND_COLOR);
      boolean visible = false;
      if (mStatusBar.has("visible")) {
        visible = mStatusBar.optBoolean("visible");
        if (!visible) {
          View decorView = activity.getWindow().getDecorView();
          // Hide the status bar.
          decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN);
          // Remember that you should never show the action bar if the
          // status bar is hidden, so hide that too if necessary.
          ActionBar actionBar = activity.getActionBar();
          if (actionBar != null) actionBar.hide();
          return;
        }
      }
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

    if (mStatusBar == null) {
      return;
    }

    String statusBarAppearance = mStatusBar.optString(ExponentManifest.MANIFEST_STATUS_BAR_APPEARANCE);

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

}
