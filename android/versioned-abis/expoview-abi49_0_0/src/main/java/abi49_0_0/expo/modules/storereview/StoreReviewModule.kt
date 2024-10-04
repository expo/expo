package abi49_0_0.expo.modules.storereview

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.google.android.gms.common.GooglePlayServicesUtil
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.ReviewManagerFactory
import abi49_0_0.expo.modules.kotlin.Promise
import abi49_0_0.expo.modules.kotlin.exception.Exceptions
import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition

class StoreReviewModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val currentActivity
    get() = appContext.activityProvider?.currentActivity
      ?: throw MissingCurrentActivityException()

  override fun definition() = ModuleDefinition {
    Name("ExpoStoreReview")

    AsyncFunction("isAvailableAsync") {
      return@AsyncFunction Build.VERSION.SDK_INT >= 21 && isPlayStoreInstalled()
    }

    AsyncFunction("requestReview") { promise: Promise ->
      requestReview(promise)
    }
  }

  private fun requestReview(promise: Promise) {
    val manager: ReviewManager = ReviewManagerFactory.create(context)
    val request = manager.requestReviewFlow()

    request.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        val reviewInfo = task.result
        reviewInfo?.let {
          val flow = manager.launchReviewFlow(currentActivity, it)
          flow.addOnCompleteListener { result ->
            if (result.isSuccessful) {
              promise.resolve(null)
            } else {
              promise.reject(RMTaskException())
            }
          }
        } ?: promise.reject(RMTaskException())
      } else {
        promise.reject(RMUnsuccessfulTaskException())
      }
    }
  }

  private fun isPlayStoreInstalled(): Boolean = try {
    context.packageManager
      .getPackageInfo(GooglePlayServicesUtil.GOOGLE_PLAY_STORE_PACKAGE, 0)
    true
  } catch (e: PackageManager.NameNotFoundException) {
    false
  }
}
