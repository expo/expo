package abi44_0_0.host.exp.exponent.modules.universal

import android.content.Context
import com.facebook.FacebookSdk
import abi44_0_0.expo.modules.core.Promise
import abi44_0_0.expo.modules.core.arguments.ReadableArguments
import abi44_0_0.expo.modules.core.interfaces.LifecycleEventListener
import abi44_0_0.expo.modules.facebook.FacebookModule

private const val ERR_FACEBOOK_UNINITIALIZED = "ERR_FACEBOOK_UNINITIALIZED"

class ScopedFacebookModule(context: Context) : FacebookModule(context), LifecycleEventListener {
  private var isInitialized = false

  override fun onHostResume() {
    if (appId != null) {
      FacebookSdk.setApplicationId(appId)
    }
    if (appName != null) {
      FacebookSdk.setApplicationName(appName)
    }
  }

  override fun initializeAsync(options: ReadableArguments, promise: Promise) {
    isInitialized = true
    super.initializeAsync(options, promise)
  }

  override fun logInWithReadPermissionsAsync(config: ReadableArguments, promise: Promise) {
    if (!isInitialized) {
      promise.reject(ERR_FACEBOOK_UNINITIALIZED, "Facebook SDK has not been initialized yet.")
    }
    super.logInWithReadPermissionsAsync(config, promise)
  }

  override fun getAuthenticationCredentialAsync(promise: Promise) {
    if (!isInitialized) {
      promise.reject(ERR_FACEBOOK_UNINITIALIZED, "Facebook SDK has not been initialized yet.")
    }
    super.getAuthenticationCredentialAsync(promise)
  }

  override fun logOutAsync(promise: Promise) {
    if (!isInitialized) {
      promise.reject(ERR_FACEBOOK_UNINITIALIZED, "Facebook SDK has not been initialized yet.")
    }
    super.logOutAsync(promise)
  }

  override fun onHostPause() {
    FacebookSdk.setApplicationId(null)
    FacebookSdk.setApplicationName(null)
  }

  override fun onHostDestroy() {
    // do nothing
  }
}
