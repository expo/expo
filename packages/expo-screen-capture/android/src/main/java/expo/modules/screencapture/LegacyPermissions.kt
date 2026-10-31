package expo.modules.screencapture

import android.os.Bundle
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.ExpoObject
import io.github.expo.modules.v2.async.Promise
import io.github.expo.modules.v2.react.reactContextOrNull

private const val NATIVE_MODULES_PROXY_NAME = "NativeUnimoduleProxy"

/**
 * The permissions service of the legacy app context. The Expo Modules API 2.0 has no permissions
 * API yet, and the legacy service keeps the permission state that the other modules share.
 */
internal val ExpoObject.legacyPermissions: Permissions?
  get() {
    val reactContext = reactContextOrNull ?: return null
    val proxy = (
      reactContext.getNativeModule(NATIVE_MODULES_PROXY_NAME)
        ?: reactContext.nativeModules.find { it is NativeModulesProxy }
      ) as? NativeModulesProxy
    return proxy?.kotlinInteropModuleRegistry?.appContext?.permissions
  }

internal fun legacyPermissionsPromise(
  request: (expo.modules.kotlin.Promise) -> Unit
): Promise<Map<String, Any?>> {
  val result = Promise<Map<String, Any?>>()
  val legacyPromise = object : expo.modules.kotlin.Promise {
    override fun resolve(value: Any?) {
      val bundle = value as Bundle
      result.resolve(
        bundle.keySet().associateWith {
          @Suppress("DEPRECATION")
          bundle.get(it)
        }
      )
    }

    override fun reject(code: String?, message: String?, cause: Throwable?) {
      result.reject(CodedException(code, message, cause))
    }
  }

  try {
    request(legacyPromise)
  } catch (e: Throwable) {
    result.reject(e)
  }
  return result
}
