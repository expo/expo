// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent.modules.internal

import com.facebook.react.bridge.*
import com.reactnativecommunity.asyncstorage.AsyncStorageModule
import host.exp.exponent.kernel.KernelProvider

class ExponentUnsignedAsyncStorageModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return AsyncStorageModule.NAME
  }

  override fun canOverrideExistingModule(): Boolean {
    return true
  }

  @ReactMethod
  fun multiGet(keys: ReadableArray?, callback: Callback?) {
    KernelProvider.instance.handleError(ERROR_MESSAGE)
  }

  @ReactMethod
  fun multiSet(keyValueArray: ReadableArray?, callback: Callback?) {
    KernelProvider.instance.handleError(ERROR_MESSAGE)
  }

  @ReactMethod
  fun multiRemove(keys: ReadableArray?, callback: Callback?) {
    KernelProvider.instance.handleError(ERROR_MESSAGE)
  }

  @ReactMethod
  fun multiMerge(keyValueArray: ReadableArray?, callback: Callback?) {
    KernelProvider.instance.handleError(ERROR_MESSAGE)
  }

  @ReactMethod
  fun clear(callback: Callback?) {
    KernelProvider.instance.handleError(ERROR_MESSAGE)
  }

  @ReactMethod
  fun getAllKeys(callback: Callback?) {
    KernelProvider.instance.handleError(ERROR_MESSAGE)
  }

  companion object {
    private const val ERROR_MESSAGE = "Can't use AsyncStorage in unsigned Experience."
  }
}
