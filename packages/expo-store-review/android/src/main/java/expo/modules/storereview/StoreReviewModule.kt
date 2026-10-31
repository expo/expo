package expo.modules.storereview

import android.content.pm.PackageManager
import com.google.android.gms.common.GooglePlayServicesUtil
import com.google.android.gms.tasks.Task
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.ReviewManagerFactory
import expo.modules.kotlin.exception.Exceptions
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume

@ExpoModule("ExpoStoreReview")
class StoreReviewModule : Module() {
  @JS
  suspend fun isAvailableAsync(): Boolean = withContext(Dispatchers.IO) {
    isPlayStoreInstalled()
  }

  @JS
  suspend fun requestReview(): Unit = withContext(Dispatchers.Main) {
    val manager: ReviewManager = ReviewManagerFactory.create(androidContext)
    val request = manager.requestReviewFlow().awaitCompletion()
    if (!request.isSuccessful) {
      throw RMUnsuccessfulTaskException()
    }
    val reviewInfo = request.result ?: throw RMTaskException()
    val activity = currentActivity ?: throw Exceptions.MissingActivity()
    val flow = manager.launchReviewFlow(activity, reviewInfo).awaitCompletion()
    if (!flow.isSuccessful) {
      throw RMTaskException()
    }
  }

  private suspend fun <T> Task<T>.awaitCompletion(): Task<T> = suspendCancellableCoroutine { continuation ->
    addOnCompleteListener { task -> continuation.resume(task) }
  }

  private fun isPlayStoreInstalled(): Boolean = try {
    androidContext.packageManager
      .getPackageInfo(GooglePlayServicesUtil.GOOGLE_PLAY_STORE_PACKAGE, 0)
    true
  } catch (e: PackageManager.NameNotFoundException) {
    false
  }
}
