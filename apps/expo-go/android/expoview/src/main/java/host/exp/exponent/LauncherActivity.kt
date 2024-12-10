// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.Manifest
import android.app.ActivityManager.RecentTaskInfo
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.lifecycle.get
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.Kernel
import host.exp.expoview.BuildConfig
import javax.inject.Inject

private const val KEEP_ALIVE_MS = (1000 * 60).toLong()

// This activity is transparent. It uses our custom theme @style/Theme.Exponent.Translucent.
// Calls finish() once it is done processing Intent.
class LauncherActivity : AppCompatActivity() {
  @Inject
  lateinit var kernel: Kernel

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

  override fun onStop() {
    // Replaces the stay awake service
    super.onStop()
    if (ProcessLifecycleOwner.get().lifecycle.currentState == Lifecycle.State.CREATED) {
      Handler(Looper.getMainLooper()).postDelayed({ finish() }, KEEP_ALIVE_MS)
    }
  }

  public override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)

    // We shouldn't ever get here, since we call finish() in onCreate. Just want to be safe
    // since this Activity is singleTask and there might be some edge case where this is called.
    kernel.handleIntent(this, intent)
  }
}
