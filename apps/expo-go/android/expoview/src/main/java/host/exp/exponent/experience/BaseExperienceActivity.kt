// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.annotation.SuppressLint
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import com.facebook.drawee.backends.pipeline.Fresco
import de.greenrobot.event.EventBus
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.*
import host.exp.exponent.kernel.ExponentErrorMessage.Companion.developerErrorMessage
import host.exp.exponent.utils.AsyncCondition
import host.exp.exponent.utils.AsyncCondition.AsyncConditionListener
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.expoview.Exponent
import javax.inject.Inject

data class ErrorProcessingResult(
  val isFatal: Boolean,
  val errorMessage: ExponentErrorMessage,
  val errorHeader: String?,
  val canRetry: Boolean
)

abstract class BaseExperienceActivity : ReactNativeActivity() {
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

  @SuppressLint("MissingSuperCall")
  override fun onBackPressed() {
    if (!isCrashed) {
      reactHost?.onBackPressed()
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

    reactHost?.onHostDestroy()
    reactHost = null
    reactSurface = null

    // Fresco leaks ReactApplicationContext
    Fresco.initialize(applicationContext)

    // TODO: OkHttpClientProvider leaks Activity. Clean it up.
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    if (reactHost != null && !isCrashed) {
      reactHost?.onConfigurationChanged(this)
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
      kernel.exponentSharedPreferences.setLong(ExponentSharedPreferences.ExponentSharedPreferencesKey.LAST_FATAL_ERROR_DATE_KEY, System.currentTimeMillis())
      val (isFatal, errorMessage, errorHeader, canRetry) = sendErrorsToErrorActivity()
      if (!shouldShowErrorScreen(errorMessage)) {
        return@runOnUiThread
      }
      if (!isFatal) {
        return@runOnUiThread
      }

      if (!isDebugModeEnabled) {
        removeAllViewsFromContainer()
        reactHost = null
        reactSurface = null
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
        putExtra(ErrorActivity.CAN_RETRY_KEY, canRetry)
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
      val activity = visibleActivity
      if (activity != null) {
        activity.consumeErrorQueue()
      } else if (ErrorActivity.visibleActivity != null) {
        // If ErrorActivity is already started and we get another error from RN.
        sendErrorsToErrorActivity()
      }
      // Otherwise onResume will consumeErrorQueue
    }

    private fun sendErrorsToErrorActivity(): ErrorProcessingResult {
      var isFatal = false
      var errorMessage = developerErrorMessage("")
      var errorHeader: String? = null
      var canRetry = true
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
          canRetry = canRetry && error.canRetry
        }
      }
      return ErrorProcessingResult(isFatal, errorMessage, errorHeader, canRetry)
    }
  }
}
