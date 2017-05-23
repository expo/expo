// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.branch;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;

import host.exp.exponent.ABIVersion;
import host.exp.exponent.RNObject;
import io.branch.referral.Branch;

public class BranchManager {
  public static boolean isEnabled(Context context) {
    try {
      final ApplicationInfo ai = context.getPackageManager().getApplicationInfo(
          context.getPackageName(),
          PackageManager.GET_META_DATA);
      if (ai.metaData != null) {
        return ai.metaData.getString("io.branch.sdk.BranchKey") != null;
      }
    } catch (final PackageManager.NameNotFoundException ignore) {}

    return false;
  }

  public static void initialize(Application application) {
    if (!isEnabled(application)) {
      return;
    }
    Branch.getAutoInstance(application);
  }

  public static void handleLink(Activity activity, String uri, String sdkVersion) {
    if (!isEnabled(activity) || ABIVersion.toNumber(sdkVersion) < ABIVersion.toNumber("17.0.0")) {
      return;
    }
    RNObject branchModule = new RNObject("host.exp.exponent.modules.api.branch.RNBranchModule");
    branchModule.loadVersion(sdkVersion);
    branchModule.callStatic("initSession", Uri.parse(uri), activity);
  }
}
