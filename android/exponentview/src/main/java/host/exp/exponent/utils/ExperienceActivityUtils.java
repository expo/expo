// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.view.WindowManager;

import org.json.JSONObject;

import host.exp.exponent.ABIVersion;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;

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

  public static void setWindowTransparency(final String sdkVersion, final JSONObject manifest, final Activity activity) {
    // For 5.0.0 and below everything has transparent status
    if (ABIVersion.toNumber(sdkVersion) <= ABIVersion.toNumber("5.0.0")) {
      return;
    }

    String statusBarColor = manifest.optString(ExponentManifest.MANIFEST_STATUS_BAR_COLOR);
    if (statusBarColor == null || !ColorParser.isValid(statusBarColor)) {
      return;
    }

    try {
      activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
      activity.getWindow().setStatusBarColor(Color.parseColor(statusBarColor));
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }

  public static void setTaskDescription(final ExponentManifest exponentManifest, final JSONObject manifest, final Activity activity) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      final String iconUrl = manifest.optString(ExponentManifest.MANIFEST_ICON_URL_KEY);
      final int color = exponentManifest.getColorFromManifest(manifest);

      exponentManifest.loadIconBitmap(iconUrl, new ExponentManifest.BitmapListener() {
        @Override
        public void onLoadBitmap(Bitmap bitmap) {
          // This if statement is only needed so the compiler doesn't show an error.
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            activity.setTaskDescription(new ActivityManager.TaskDescription(
                manifest.optString(ExponentManifest.MANIFEST_NAME_KEY),
                bitmap,
                color
            ));
          }
        }
      });
    }
  }
}
