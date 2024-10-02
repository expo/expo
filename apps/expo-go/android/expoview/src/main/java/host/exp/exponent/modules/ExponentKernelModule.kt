// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.modules

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import host.exp.exponent.Constants
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.experience.ErrorActivity
import host.exp.exponent.kernel.DevMenuManager
import host.exp.exponent.kernel.ExponentKernelModuleInterface
import host.exp.exponent.kernel.ExponentKernelModuleProvider
import host.exp.exponent.kernel.ExponentKernelModuleProvider.KernelEvent
import host.exp.exponent.kernel.ExponentKernelModuleProvider.KernelEventCallback
import host.exp.exponent.kernel.Kernel
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.utils.BundleJSONConverter
import org.json.JSONObject
import java.util.*
import javax.inject.Inject

class ExponentKernelModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), ExponentKernelModuleInterface {

  @Inject
  lateinit var kernel: Kernel

  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  @Inject
  lateinit var devMenuManager: DevMenuManager

  override fun getConstants(): Map<String, Any> {
    return mapOf(
      "sdkVersions" to listOf(Constants.SDK_VERSION)
    )
  }

  override fun getName(): String {
    return "ExponentKernel"
  }

  override fun consumeEventQueue() {
    if (ExponentKernelModuleProvider.eventQueue.size == 0) {
      return
    }

    val (name, data, callback) = ExponentKernelModuleProvider.eventQueue.remove()

    val eventId = UUID.randomUUID().toString()
    data.putString("eventId", eventId)

    kernelEventCallbacks[eventId] = callback

    try {
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(name, data)
    } catch (e: Exception) {
      onEventFailure(eventId, e.message)
    }

    consumeEventQueue()
  }

  //region Exported methods
  @ReactMethod
  fun getSessionAsync(promise: Promise) {
    val sessionString = exponentSharedPreferences.getString(ExponentSharedPreferences.ExponentSharedPreferencesKey.EXPO_AUTH_SESSION)
    if (sessionString == null) {
      promise.resolve(null)
      return
    }

    try {
      val sessionJsonObject = JSONObject(sessionString)
      val session = Arguments.fromBundle(BundleJSONConverter.convertToBundle(sessionJsonObject))
      promise.resolve(session)
    } catch (e: Exception) {
      promise.resolve(null)
      EXL.e(TAG, e)
    }
  }

  @ReactMethod
  fun setSessionAsync(session: ReadableMap, promise: Promise) {
    try {
      val sessionJsonObject = JSONObject(session.toHashMap() as Map<*, *>?)
      exponentSharedPreferences.updateSession(sessionJsonObject)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("ERR_SESSION_NOT_SAVED", "Could not save session secret", e)
      EXL.e(TAG, e)
    }
  }

  @ReactMethod
  fun removeSessionAsync(promise: Promise) {
    try {
      exponentSharedPreferences.removeSession()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("ERR_SESSION_NOT_REMOVED", "Could not remove session secret", e)
      EXL.e(TAG, e)
    }
  }

  @ReactMethod
  fun getLastCrashDate(promise: Promise) {
    try {
      val lastCrashDate = exponentSharedPreferences.getLong(ExponentSharedPreferences.ExponentSharedPreferencesKey.LAST_FATAL_ERROR_DATE_KEY)
      promise.resolve(lastCrashDate.toString())
    } catch (e: Exception) {
      promise.resolve(null)
      EXL.e(TAG, e)
    }
  }

  @ReactMethod
  fun goToHomeFromErrorScreen() {
    if (ErrorActivity.visibleActivity == null) {
      // shouldn't ever get here
      EXL.e(TAG, "visibleActivity was null in goToHomeFromErrorScreen")
      return
    }
    ErrorActivity.visibleActivity!!.onClickHome()
  }

  @ReactMethod
  fun reloadFromErrorScreen() {
    if (ErrorActivity.visibleActivity == null) {
      // shouldn't ever get here
      EXL.e(TAG, "visibleActivity was null in reloadFromErrorScreen")
      return
    }
    ErrorActivity.visibleActivity!!.onClickReload()
  }

  @ReactMethod
  fun onEventSuccess(eventId: String, result: ReadableMap) {
    kernelEventCallbacks.remove(eventId)?.onEventSuccess(result)
  }

  @ReactMethod
  fun onEventFailure(eventId: String, errorMessage: String?) {
    kernelEventCallbacks.remove(eventId)?.onEventFailure(errorMessage)
  }

  //region DevMenu
  @ReactMethod
  fun doesCurrentTaskEnableDevtoolsAsync(promise: Promise) {
    promise.resolve(devMenuManager.isDevSupportEnabledByCurrentActivity())
  }

  @ReactMethod
  fun getIsOnboardingFinishedAsync(promise: Promise) {
    promise.resolve(devMenuManager.isOnboardingFinished())
  }

  @ReactMethod
  fun setIsOnboardingFinishedAsync(isOnboardingFinished: Boolean, promise: Promise) {
    devMenuManager.setIsOnboardingFinished(isOnboardingFinished)
    promise.resolve(null)
  }

  @ReactMethod
  fun closeDevMenuAsync(promise: Promise) {
    devMenuManager.hideInCurrentActivity()
    promise.resolve(true)
  }

  @ReactMethod
  fun getDevMenuItemsToShowAsync(promise: Promise) {
    val devMenuItems = devMenuManager.getMenuItems()
    promise.resolve(devMenuItems)
  }

  @ReactMethod
  fun selectDevMenuItemWithKeyAsync(itemKey: String?, promise: Promise) {
    devMenuManager.selectItemWithKey(itemKey!!)
    devMenuManager.requestToClose()
    promise.resolve(true)
  }

  @ReactMethod
  fun reloadAppAsync(promise: Promise) {
    devMenuManager.reloadApp()
    devMenuManager.requestToClose()
    promise.resolve(true)
  }

  @ReactMethod
  fun goToHomeAsync(promise: Promise) {
    kernel.openHomeActivity()
    devMenuManager.requestToClose()
    promise.resolve(true)
  } //endregion DevMenu

  //endregion Exported methods
  companion object {
    private val TAG = ExponentKernelModule::class.java.simpleName

    private var instance: ExponentKernelModule? = null

    private val kernelEventCallbacks = mutableMapOf<String, KernelEventCallback>()

    fun queueEvent(name: String, data: WritableMap, callback: KernelEventCallback) {
      queueEvent(KernelEvent(name, data, callback))
    }

    fun queueEvent(event: KernelEvent) {
      ExponentKernelModuleProvider.eventQueue.add(event)
      instance?.consumeEventQueue()
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ExponentKernelModule::class.java, this)
    instance = this
  }
}
