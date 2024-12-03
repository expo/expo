// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.Manifest
import android.app.Activity
import android.app.ActivityManager.RecentTaskInfo
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import androidx.core.content.ContextCompat
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.Kernel
import host.exp.expoview.BuildConfig
import javax.inject.Inject

// This activity is transparent. It uses android:style/Theme.Translucent.NoTitleBar.
// Calls finish() once it is done processing Intent.
class LauncherActivity : Activity() {
  @Inject
  lateinit var kernel: Kernel
  private var isAppInForeground = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (BuildConfig.DEBUG) {
      // Need WRITE_EXTERNAL_STORAGE for method tracing
      if (Constants.DEBUG_METHOD_TRACING) {
        if (ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
          ) != PackageManager.PERMISSION_GRANTED
        ) {
          requestPermissions(arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE), 123)
        }
      }
    }
    NativeModuleDepsProvider.instance.inject(LauncherActivity::class.java, this)

    // Kernel's JS needs to be started for the dev menu to work when the app is launched through the deep link.
    kernel.startJSKernel(this)
    kernel.handleIntent(this, intent)

    // Delay to prevent race condition where finish() is called before service starts.
    Handler(mainLooper).postDelayed(
      Runnable {
        try {
          // Crash with NoSuchFieldException instead of hard crashing at task.getTaskInfo().numActivities
          RecentTaskInfo::class.java.getDeclaredField("numActivities")
          for (task in kernel.tasks) {
            if (task.taskInfo.id == taskId) {
              if (task.taskInfo.numActivities == 1) {
                finishAndRemoveTask()
                return@Runnable
              } else {
                break
              }
            }
          }
        } catch (e: Exception) {
          // just go straight to finish()
        }
        finish()
      },
      100
    )
  }

  override fun onResume() {
    super.onResume()
    isAppInForeground = true
    startStayAwakeServiceIfNeeded()
  }

  override fun onPause() {
    super.onPause()
    isAppInForeground = false
  }

  private fun startStayAwakeServiceIfNeeded() {
    if (isAppInForeground) {
      // Start a service to keep our process awake. This isn't necessary most of the time, but
      // if the user has "Don't keep activities" on it's possible for the process to exit in between
      // finishing this activity and starting the BaseExperienceActivity.
      startService(ExponentIntentService.getActionStayAwake(applicationContext))
    }
  }

  public override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)

    // We shouldn't ever get here, since we call finish() in onCreate. Just want to be safe
    // since this Activity is singleTask and there might be some edge case where this is called.
    kernel.handleIntent(this, intent)
  }
}
