// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.app.IntentService
import android.content.Context
import android.content.Intent
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.kernel.Kernel
import host.exp.exponent.kernel.KernelConstants
import javax.inject.Inject

private const val ACTION_RELOAD_EXPERIENCE = "host.exp.exponent.action.RELOAD_EXPERIENCE"
private const val ACTION_STAY_AWAKE = "host.exp.exponent.action.STAY_AWAKE"

class ExponentIntentService : IntentService("ExponentIntentService") {
  @Inject
  lateinit var kernel: Kernel

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
    stopSelf()
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
