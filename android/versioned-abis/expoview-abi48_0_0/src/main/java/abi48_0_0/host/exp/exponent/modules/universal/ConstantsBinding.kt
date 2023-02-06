// Copyright 2015-present 650 Industries. All rights reserved.
package abi48_0_0.host.exp.exponent.modules.universal

import android.content.Context
import javax.inject.Inject
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.kernel.ExpoViewKernel
import host.exp.exponent.kernel.KernelConstants
import abi48_0_0.expo.modules.constants.ConstantsService
import abi48_0_0.expo.modules.interfaces.constants.ConstantsInterface
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
      this["supportedExpoSdks"] = Constants.SDK_VERSIONS_LIST
      this["appOwnership"] = appOwnership
      this["executionEnvironment"] = executionEnvironment.string

      this.putAll(experienceProperties)

      this["platform"] = mapOf(
        "android" to mapOf(
          "versionCode" to if (appOwnership == "expo") null else Constants.ANDROID_VERSION_CODE
        )
      )
      this["isDetached"] = Constants.isStandaloneApp()
    }
  }

  override fun getAppScopeKey(): String? {
    return try {
      manifest.getScopeKey()
    } catch (e: JSONException) {
      null
    }
  }

  override fun getAppOwnership(): String {
    return if (experienceProperties.containsKey(KernelConstants.MANIFEST_URL_KEY)) {
      val manifestUrl = experienceProperties[KernelConstants.MANIFEST_URL_KEY] as String?
      when {
        Constants.INITIAL_URL == null -> "expo"
        manifestUrl == Constants.INITIAL_URL -> "standalone"
        else -> "guest"
      }
    } else {
      "expo"
    }
  }

  private val executionEnvironment: ExecutionEnvironment
    get() = if (Constants.isStandaloneApp()) {
      ExecutionEnvironment.STANDALONE
    } else {
      ExecutionEnvironment.STORE_CLIENT
    }

  override fun getOrCreateInstallationId(): String {
    // Override scoped installationId from ConstantsService with unscoped
    return exponentSharedPreferences.getOrCreateUUID()
  }

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
    statusBarHeightInternal = if (resourceId > 0) convertPixelsToDp(
      context.resources.getDimensionPixelSize(resourceId).toFloat(), context
    ) else 0
  }
}
