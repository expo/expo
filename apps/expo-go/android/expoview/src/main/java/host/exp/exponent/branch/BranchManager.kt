// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.branch

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import host.exp.exponent.analytics.EXL
import io.branch.referral.Branch

object BranchManager {
  private val TAG = BranchManager::class.java.simpleName

  private fun isEnabled(context: Context): Boolean {
    try {
      val ai = context.packageManager.getApplicationInfo(
        context.packageName,
        PackageManager.GET_META_DATA
      )
      if (ai.metaData != null) {
        return ai.metaData.getString("io.branch.sdk.BranchKey") != null
      }
    } catch (ignore: PackageManager.NameNotFoundException) {
    }
    return false
  }

  fun initialize(application: Application) {
    if (!isEnabled(application)) {
      return
    }
    try {
      Class.forName("io.branch.referral.Branch")
      Branch.getAutoInstance(application)
    } catch (e: ClassNotFoundException) {
      // expected if Branch is not installed, fail silently
    }
  }

  fun handleLink(activity: Activity, uri: String?) {
    if (!isEnabled(activity)) {
      return
    }
    try {
      val branchModule = Class.forName("io.branch.rnbranch.RNBranchModule")
      val m = branchModule.getMethod("initSession", Uri::class.java, Activity::class.java)
      m.invoke(null, Uri.parse(uri), activity)
    } catch (e: ClassNotFoundException) {
      // expected if Branch is not installed, fail silently
    } catch (e: Exception) {
      EXL.e(TAG, e)
    }
  }
}
