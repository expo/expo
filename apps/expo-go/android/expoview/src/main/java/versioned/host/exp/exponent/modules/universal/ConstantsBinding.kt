// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent.modules.universal

import android.content.Context
import javax.inject.Inject
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.kernel.ExpoViewKernel
import expo.modules.constants.ConstantsService
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.manifests.core.Manifest
import host.exp.exponent.Constants
import host.exp.exponent.di.NativeModuleDepsProvider
import org.json.JSONException

class ConstantsBinding(
  context: Context,
  private val experienceProperties: Map<String, Any?>,
  private val manifest: Manifest
) : ConstantsService(context), ConstantsInterface {
  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  override fun getConstants(): Map<String, Any?> {
    return super.getConstants().toMutableMap().apply {
      this["expoVersion"] = ExpoViewKernel.instance.versionName
      this["manifest"] = manifest.toString()
      this["nativeAppVersion"] = ExpoViewKernel.instance.versionName
      this["nativeBuildVersion"] = Constants.ANDROID_VERSION_CODE
      this["supportedExpoSdks"] = listOf(Constants.SDK_VERSION)
      this["appOwnership"] = "expo"
      this["executionEnvironment"] = executionEnvironment.string

      this.putAll(experienceProperties)

      this["platform"] = mapOf(
        "android" to mapOf(
          "versionCode" to null
        )
      )
      this["isDetached"] = false
    }
  }

  override fun getAppScopeKey(): String? {
    return try {
      manifest.getScopeKey()
    } catch (e: JSONException) {
      null
    }
  }

  private val executionEnvironment: ExecutionEnvironment
    get() = ExecutionEnvironment.STORE_CLIENT

  companion object {
    private fun convertPixelsToDp(px: Float, context: Context): Int {
      val resources = context.resources
      val metrics = resources.displayMetrics
      val dp = px / (metrics.densityDpi / 160f)
      return dp.toInt()
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ConstantsBinding::class.java, this)
    val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
    statusBarHeightInternal = if (resourceId > 0) {
      convertPixelsToDp(
        context.resources.getDimensionPixelSize(resourceId).toFloat(), context
      )
    } else {
      0
    }
  }
}
