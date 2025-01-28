// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent.modules.internal

import android.net.Uri
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.intent.IntentModule
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry
import javax.inject.Inject

@ReactModule(name = IntentModule.NAME, canOverrideExistingModule = true)
class ExponentIntentModule(
  reactContext: ReactApplicationContext,
  private val experienceProperties: Map<String, Any?>
) : IntentModule(reactContext) {
  @Inject
  private lateinit var kernelServiceRegistry: ExpoKernelServiceRegistry

  override fun canOverrideExistingModule(): Boolean {
    return true
  }

  override fun getInitialURL(promise: Promise) {
    try {
      promise.resolve(experienceProperties[KernelConstants.INTENT_URI_KEY])
    } catch (e: Exception) {
      promise.reject(
        JSApplicationIllegalArgumentException(
          "Could not get the initial URL : " + e.message
        )
      )
    }
  }

  override fun openURL(url: String?, promise: Promise) {
    if (url.isNullOrEmpty()) {
      promise.reject(JSApplicationIllegalArgumentException("Invalid URL: $url"))
      return
    }
    val uri = Uri.parse(url)
    if (kernelServiceRegistry.linkingKernelService.canOpenURI(uri)) {
      reactApplicationContext.runOnUiQueueThread {
        kernelServiceRegistry.linkingKernelService.openURI(uri)
        promise.resolve(true)
      }
    } else {
      super.openURL(url, promise)
    }
  }

  override fun canOpenURL(url: String?, promise: Promise) {
    if (url == null || url.isEmpty()) {
      promise.reject(JSApplicationIllegalArgumentException("Invalid URL: $url"))
      return
    }
    val uri = Uri.parse(url)
    if (kernelServiceRegistry.linkingKernelService.canOpenURI(uri)) {
      promise.resolve(true)
    } else {
      super.canOpenURL(url, promise)
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ExponentIntentModule::class.java, this)
  }
}
