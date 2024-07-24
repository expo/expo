// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.app.IntentService
import android.content.Context
import android.content.Intent
import android.os.Handler
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.kernel.Kernel
import host.exp.exponent.kernel.KernelConstants
import javax.inject.Inject

private const val ACTION_RELOAD_EXPERIENCE = "host.exp.exponent.action.RELOAD_EXPERIENCE"
private const val ACTION_STAY_AWAKE = "host.exp.exponent.action.STAY_AWAKE"
private const val STAY_AWAKE_MS = (1000 * 60).toLong()

class ExponentIntentService : IntentService("ExponentIntentService") {
  @Inject
  lateinit var kernel: Kernel

  private val handler = Handler()

  override fun onCreate() {
    super.onCreate()
    NativeModuleDepsProvider.instance.inject(ExponentIntentService::class.java, this)
  }

  override fun onHandleIntent(intent: Intent?) {
    if (intent == null) {
      return
    }

    val action = intent.action
    var isUserAction = false
    when (action) {
      ACTION_RELOAD_EXPERIENCE -> {
        isUserAction = true
        handleActionReloadExperience(intent.getStringExtra(KernelConstants.MANIFEST_URL_KEY)!!)
      }
      ACTION_STAY_AWAKE -> handleActionStayAwake()
    }
    if (isUserAction) {
      val kernelActivityContext = kernel.activityContext
      if (kernelActivityContext is ExperienceActivity) {
        kernelActivityContext.onNotificationAction()
      }
    }
  }

  private fun handleActionReloadExperience(manifestUrl: String) {
    kernel.reloadVisibleExperience(manifestUrl)

    // Application can't close system dialogs on Android 31 or higher.
    // See https://developer.android.com/about/versions/12/behavior-changes-all#close-system-dialogs
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.S) {
      val intent = Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS)
      sendBroadcast(intent)
    }

    stopSelf()
  }

  private fun handleActionStayAwake() {
    handler.postDelayed({ stopSelf() }, STAY_AWAKE_MS)
  }

  companion object {
    @JvmStatic fun getActionReloadExperience(context: Context, manifestUrl: String): Intent {
      return Intent(context, ExponentIntentService::class.java).apply {
        action = ACTION_RELOAD_EXPERIENCE
        putExtra(KernelConstants.MANIFEST_URL_KEY, manifestUrl)
      }
    }

    @JvmStatic fun getActionStayAwake(context: Context): Intent {
      return Intent(context, ExponentIntentService::class.java).apply {
        action = ACTION_STAY_AWAKE
      }
    }
  }
}
