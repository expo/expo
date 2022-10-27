// Copyright 2015-present 650 Industries. All rights reserved.
package abi47_0_0.host.exp.exponent.modules.internal

import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi47_0_0.com.facebook.react.module.annotations.ReactModule
import abi47_0_0.com.facebook.react.modules.storage.AsyncStorageModule
import abi47_0_0.com.facebook.react.modules.storage.ReactDatabaseSupplier
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.KernelProvider
import org.json.JSONException
import java.io.UnsupportedEncodingException

@ReactModule(name = AsyncStorageModule.NAME, canOverrideExistingModule = true)
class ExponentAsyncStorageModule(reactContext: ReactApplicationContext, manifest: Manifest) :
  AsyncStorageModule(reactContext) {
  override fun canOverrideExistingModule(): Boolean {
    return true
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
}
