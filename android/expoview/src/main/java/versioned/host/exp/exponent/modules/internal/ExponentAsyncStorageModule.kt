// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent.modules.internal

import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.reactnativecommunity.asyncstorage.AsyncStorageModule
import com.reactnativecommunity.asyncstorage.ReactDatabaseSupplier
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.KernelProvider
import org.json.JSONException
import java.io.UnsupportedEncodingException

@ReactModule(name = AsyncStorageModule.NAME, canOverrideExistingModule = false)
class ExponentAsyncStorageModule(reactContext: ReactApplicationContext, manifest: Manifest) :
  AsyncStorageModule(reactContext) {
  override fun canOverrideExistingModule(): Boolean {
    return false
  }

  companion object {
    @Throws(UnsupportedEncodingException::class)
    private fun experienceKeyToDatabaseName(experienceKey: ExperienceKey): String {
      return "RKStorage-scoped-experience-" + experienceKey.getUrlEncodedScopeKey()
    }
  }

  init {
    try {
      val experienceKey = ExperienceKey.fromManifest(manifest)
      val databaseName = experienceKeyToDatabaseName(experienceKey)
      mReactDatabaseSupplier = ReactDatabaseSupplier(reactContext, databaseName)
    } catch (e: JSONException) {
      KernelProvider.instance.handleError("Requires ExperienceKey")
    } catch (e: UnsupportedEncodingException) {
      KernelProvider.instance.handleError("Couldn't URL encode ExperienceKey")
    }
  }

  @ReactMethod
  override fun multiGet(keys: ReadableArray?, callback: Callback?) {
    super.multiGet(keys, callback)
  }

  @ReactMethod
  override fun multiSet(keyValueArray: ReadableArray?, callback: Callback?) {
    super.multiSet(keyValueArray, callback)
  }

  @ReactMethod
  override fun multiRemove(keys: ReadableArray?, callback: Callback?) {
    super.multiRemove(keys, callback)
  }

  @ReactMethod
  override fun multiMerge(keyValueArray: ReadableArray?, callback: Callback?) {
    super.multiMerge(keyValueArray, callback)
  }

  @ReactMethod
  override fun clear(callback: Callback?) {
    super.clear(callback)
  }

  @ReactMethod
  override fun getAllKeys(callback: Callback?) {
    super.getAllKeys(callback)
  }
}
