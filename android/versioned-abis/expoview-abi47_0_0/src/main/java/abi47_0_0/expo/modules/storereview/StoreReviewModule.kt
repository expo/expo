package abi47_0_0.expo.modules.storereview

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.google.android.gms.common.GooglePlayServicesUtil
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.ReviewManagerFactory
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.ModuleRegistry
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.core.interfaces.ActivityProvider
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod

class StoreReviewModule(private val mContext: Context) :
  ExportedModule(mContext) {
  companion object {
    private const val NAME = "ExpoStoreReview"
  }

  private lateinit var mActivityProvider: ActivityProvider

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
  }

  @ExpoMethod
  fun isAvailableAsync(promise: Promise) {
    if (Build.VERSION.SDK_INT >= 21 && isPlayStoreInstalled()) {
      promise.resolve(true)
    } else {
      promise.resolve(false)
    }
  }

  @ExpoMethod
  fun requestReview(promise: Promise) {
    val manager: ReviewManager = ReviewManagerFactory.create(mContext)
    val request = manager.requestReviewFlow()
    request.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        val reviewInfo = task.result
        val flow = manager.launchReviewFlow(mActivityProvider.currentActivity, reviewInfo)
        flow.addOnCompleteListener { task ->
          if (task.isSuccessful) {
            promise.resolve(null)
          } else {
            promise.reject("ERR_STORE_REVIEW_FAILED", "Android ReviewManager task failed")
          }
        }
      } else {
        promise.reject("ERR_STORE_REVIEW_FAILED", "Android ReviewManager task was not successful")
      }
    }
  }

  private fun isPlayStoreInstalled(): Boolean {
    return try {
      mContext.packageManager
        .getPackageInfo(GooglePlayServicesUtil.GOOGLE_PLAY_STORE_PACKAGE, 0)
      true
    } catch (e: PackageManager.NameNotFoundException) {
      false
    }
  }
}
