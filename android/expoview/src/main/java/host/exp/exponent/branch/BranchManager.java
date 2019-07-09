// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.branch;

import java.lang.reflect.Method;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;

import host.exp.exponent.analytics.EXL;
import io.branch.referral.Branch;

public class BranchManager {

  private static String TAG = BranchManager.class.getSimpleName();

  public static boolean isEnabled(Context context) {
    try {
      final ApplicationInfo ai = context.getPackageManager().getApplicationInfo(
          context.getPackageName(),
          PackageManager.GET_META_DATA);
      if (ai.metaData != null) {
        return ai.metaData.getString("io.branch.sdk.BranchKey") != null;
      }
    } catch (final PackageManager.NameNotFoundException ignore) {
    }

    return false;
  }

  public static void initialize(Application application) {
    if (!isEnabled(application)) {
      return;
    }
    try {
      Class.forName("io.branch.referral.Branch");
      Branch.getAutoInstance(application);
    } catch (ClassNotFoundException e) {
      // expected if Branch is not installed, fail silently
    }
  }

  public static void handleLink(Activity activity, String uri, String sdkVersion) {
    if (!isEnabled(activity)) {
      return;
    }

    try {
      Class branchModule = Class.forName("io.branch.rnbranch.RNBranchModule");
      Method m = branchModule.getMethod("initSession", Uri.class, Activity.class);
      m.invoke(null, Uri.parse(uri), activity);
    } catch (ClassNotFoundException e) {
      // expected if Branch is not installed, fail silently
    } catch (Exception e) {
      EXL.e(TAG, e);
    }
  }
}
