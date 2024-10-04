// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import com.facebook.drawee.backends.pipeline.Fresco
import de.greenrobot.event.EventBus
import host.exp.exponent.Constants
import host.exp.exponent.RNObject
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.*
import host.exp.exponent.kernel.ExponentErrorMessage.Companion.developerErrorMessage
import host.exp.exponent.utils.AsyncCondition
import host.exp.exponent.utils.AsyncCondition.AsyncConditionListener
import host.exp.expoview.Exponent
import javax.inject.Inject

abstract class BaseExperienceActivity : MultipleVersionReactNativeActivity() {
  abstract class ExperienceEvent internal constructor(val experienceKey: ExperienceKey)

  class ExperienceForegroundedEvent internal constructor(experienceKey: ExperienceKey) :
    ExperienceEvent(experienceKey)

  class ExperienceBackgroundedEvent internal constructor(experienceKey: ExperienceKey) :
    ExperienceEvent(experienceKey)

  class ExperienceContentLoaded(experienceKey: ExperienceKey) : ExperienceEvent(experienceKey)

  @Inject
  protected lateinit var kernel: Kernel

  private var onResumeTime: Long = 0

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    isInForeground = true
    reactRootView = RNObject("com.facebook.react.ReactRootView")
    NativeModuleDepsProvider.instance.inject(BaseExperienceActivity::class.java, this)
  }

  override fun onResume() {
    super.onResume()
    kernel.activityContext = this
    Exponent.instance.currentActivity = this
    visibleActivity = this

    // Consume any errors that happened before onResume
    consumeErrorQueue()
    isInForeground = true
    onResumeTime = System.currentTimeMillis()
    AsyncCondition.wait(
      KernelConstants.EXPERIENCE_ID_SET_FOR_ACTIVITY_KEY,
      object : AsyncConditionListener {
        override fun isReady(): Boolean {
          return experienceKey != null || this@BaseExperienceActivity is HomeActivity
        }

        override fun execute() {
          EventBus.getDefault().post(
            ExperienceForegroundedEvent(
              experienceKey!!
            )
          )
        }
      }
    )
  }

  override fun onPause() {
    if (experienceKey != null) {
      EventBus.getDefault().post(ExperienceBackgroundedEvent(experienceKey!!))
    }
    super.onPause()

    // For some reason onPause sometimes gets called soon after onResume.
    // One symptom of this is that ReactNativeActivity.startReactInstance will
    // see isInForeground == false and not start the app.
    // 500ms should be very safe. The average time between onResume and
    // onPause when the bug happens is around 10ms.
    // This seems to happen when foregrounding the app after pressing on a notification.
    // Unclear if this is because of something we're doing during the initialization process
    // or just an OS quirk.
    val timeSinceOnResume = System.currentTimeMillis() - onResumeTime
    if (timeSinceOnResume > 500) {
      isInForeground = false
      if (visibleActivity === this) {
        visibleActivity = null
      }
    }
  }

  override fun onBackPressed() {
    if (reactInstanceManager.isNotNull && !isCrashed) {
      reactInstanceManager.call("onBackPressed")
    } else {
      moveTaskToBack(true)
    }
  }

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }

  override fun onDestroy() {
    super.onDestroy()
    if (this is HomeActivity) {
      // Don't want to trash the kernel instance
      return
    }

    if (reactInstanceManager.isNotNull) {
      reactInstanceManager.onHostDestroy()
      reactInstanceManager.assign(null)
    }
    reactRootView.assign(null)

    // Fresco leaks ReactApplicationContext
    Fresco.initialize(applicationContext)

    // TODO: OkHttpClientProvider leaks Activity. Clean it up.
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    if (reactInstanceManager.isNotNull && !isCrashed) {
      reactInstanceManager.call("onConfigurationChanged", this, newConfig)
    }
  }

  protected fun consumeErrorQueue() {
    if (errorQueue.isEmpty()) {
      return
    }
    runOnUiThread {
      if (errorQueue.isEmpty()) {
        return@runOnUiThread
      }
      val (isFatal, errorMessage, errorHeader) = sendErrorsToErrorActivity()
      if (!shouldShowErrorScreen(errorMessage)) {
        return@runOnUiThread
      }
      if (!isFatal) {
        return@runOnUiThread
      }

      // we don't ever want to show any Expo UI in a production standalone app
      // so hard crash in this case
      if (Constants.isStandaloneApp() && !isDebugModeEnabled) {
        throw RuntimeException("Expo encountered a fatal error: " + errorMessage.developerErrorMessage())
      }
      if (!isDebugModeEnabled) {
        removeAllViewsFromContainer()
        reactInstanceManager.assign(null)
        reactRootView.assign(null)
      }
      isCrashed = true
      isLoading = false
      val intent = Intent(this@BaseExperienceActivity, ErrorActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
      onError(intent)
      intent.apply {
        putExtra(ErrorActivity.DEBUG_MODE_KEY, isDebugModeEnabled)
        putExtra(ErrorActivity.ERROR_HEADER_KEY, errorHeader)
        putExtra(ErrorActivity.USER_ERROR_MESSAGE_KEY, errorMessage.userErrorMessage())
        putExtra(
          ErrorActivity.DEVELOPER_ERROR_MESSAGE_KEY,
          errorMessage.developerErrorMessage()
        )
      }
      startActivity(intent)
      EventBus.getDefault().post(ExperienceDoneLoadingEvent(this))
    }
  }

  // Override
  override val isDebugModeEnabled: Boolean = false

  // Override
  protected open fun onError(intent: Intent) {
    // Modify intent used to start ErrorActivity
  }

  companion object {
    private val TAG = BaseExperienceActivity::class.java.simpleName

    // TODO: kill. just use Exponent class's activity
    var visibleActivity: BaseExperienceActivity? = null
      private set

    fun addError(error: ExponentError) {
      errorQueue.add(error)
      if (visibleActivity != null) {
        visibleActivity!!.consumeErrorQueue()
      } else if (ErrorActivity.visibleActivity != null) {
        // If ErrorActivity is already started and we get another error from RN.
        sendErrorsToErrorActivity()
      }
      // Otherwise onResume will consumeErrorQueue
    }

    private fun sendErrorsToErrorActivity(): Triple<Boolean, ExponentErrorMessage, String?> {
      var isFatal = false
      var errorMessage = developerErrorMessage("")
      var errorHeader: String? = null
      synchronized(errorQueue) {
        while (!errorQueue.isEmpty()) {
          val error = errorQueue.remove()
          ErrorActivity.addError(error)

          // Just use the last error message for now, is there a better way to do this?
          errorMessage = error.errorMessage
          errorHeader = error.errorHeader
          if (error.isFatal) {
            isFatal = true
          }
        }
      }
      return Triple(isFatal, errorMessage, errorHeader)
    }
  }
}
