// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.permissions

import android.content.Context
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.interfaces.permissions.Permissions


class PermissionsModule(context: Context) : ExportedModule(context) {
  private lateinit var mPermissions: Permissions

  @Throws(IllegalStateException::class)
  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mPermissions = moduleRegistry.getModule(Permissions::class.java)
        ?: throw IllegalStateException("Couldn't find implementation for Permissions interface.")
  }

  override fun getName(): String = "ExpoPermissions"

  @ExpoMethod
  fun getAsync(requestedPermissionsTypes: ArrayList<String>, promise: Promise) {
    try {
      promise.resolve(mPermissions.getPermissionsBundle(requestedPermissionsTypes.toTypedArray()))
    } catch (e: IllegalStateException) {
      promise.reject(ERROR_TAG + "_UNKNOWN", e)
    }
  }

  @ExpoMethod
  fun askAsync(requestedPermissionsTypes: ArrayList<String>, promise: Promise) {
    try {
      mPermissions.askForPermissionsBundle(requestedPermissionsTypes.toTypedArray()) {
        promise.resolve(it)
      }
    } catch (e: IllegalStateException) {
      promise.reject(ERROR_TAG + "_UNKNOWN", e)
    }
  }
}
