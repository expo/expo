// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.branch;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;

import host.exp.exponent.RNObject;

public class BranchManager {
  public static boolean isEnabled(Context context) {
    return false;
  }

  public static void initialize(Application application) {
    return;
  }

  public static void handleLink(Activity activity, String uri, String sdkVersion) {
    return;
  }
}
