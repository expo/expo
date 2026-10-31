package expo.modules.cellular

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.telephony.TelephonyManager
import android.util.Log
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.Exceptions
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.async.Promise
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

const val moduleName = "ExpoCellular"

@ExpoModule("ExpoCellular")
class CellularModule : Module() {
  @JS
  suspend fun getCellularGenerationAsync(): CellularGeneration = withContext(Dispatchers.IO) {
    try {
      getCurrentGeneration()
    } catch (e: SecurityException) {
      Log.w(moduleName, "READ_PHONE_STATE permission is required to acquire network type", e)
      CellularGeneration.UNKNOWN
    }
  }

  @JS
  suspend fun getIsoCountryCodeAsync(): String? = withContext(Dispatchers.IO) {
    telephonyManager()?.simCountryIso
  }

  @JS
  suspend fun getCarrierNameAsync(): String? = withContext(Dispatchers.IO) {
    telephonyManager()?.simOperatorName
  }

  @JS
  suspend fun getMobileCountryCodeAsync(): String? = withContext(Dispatchers.IO) {
    validSimOperator()?.substring(0, 3)
  }

  @JS
  suspend fun getMobileNetworkCodeAsync(): String? = withContext(Dispatchers.IO) {
    validSimOperator()?.substring(3)
  }

  @JS
  fun requestPermissionsAsync(): Promise<Map<String, Any?>> = legacyPermissionsPromise { promise ->
    Permissions.askForPermissionsWithPermissionsManager(
      permissionsManager,
      promise,
      Manifest.permission.READ_PHONE_STATE
    )
  }

  @JS
  fun getPermissionsAsync(): Promise<Map<String, Any?>> = legacyPermissionsPromise { promise ->
    Permissions.getPermissionsWithPermissionsManager(
      permissionsManager,
      promise,
      Manifest.permission.READ_PHONE_STATE
    )
  }

  /**
   * The SIM operator as MCC (3 digits) followed by MNC (2 or 3 digits), or `null` if it isn't available.
   * `getSimOperator()` can return an empty string even when the SIM state is `SIM_STATE_READY`.
   */
  private fun validSimOperator(): String? =
    telephonyManager()?.simOperator?.takeIf { it.length >= 5 }

  private fun telephonyManager() =
    (androidContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
      it?.simState == TelephonyManager.SIM_STATE_READY
    }

  private val permissionsManager: Permissions
    get() = legacyPermissions ?: throw Exceptions.PermissionsModuleNotFound()

  @SuppressLint("MissingPermission")
  private fun getCurrentGeneration(): CellularGeneration {
    val telephonyManager = telephonyManager()
      ?: return CellularGeneration.UNKNOWN
    @Suppress("DEPRECATION") // Legacy CDMA constants are deprecated, but can still be returned on older devices, so we keep mapping them instead of returning UNKNOWN
    return when (telephonyManager.dataNetworkType) {
      TelephonyManager.NETWORK_TYPE_GPRS,
      TelephonyManager.NETWORK_TYPE_EDGE,
      TelephonyManager.NETWORK_TYPE_CDMA,
      TelephonyManager.NETWORK_TYPE_1xRTT,
      TelephonyManager.NETWORK_TYPE_IDEN -> {
        CellularGeneration.CG_2G
      }
      TelephonyManager.NETWORK_TYPE_UMTS,
      TelephonyManager.NETWORK_TYPE_EVDO_0,
      TelephonyManager.NETWORK_TYPE_EVDO_A,
      TelephonyManager.NETWORK_TYPE_HSDPA,
      TelephonyManager.NETWORK_TYPE_HSUPA,
      TelephonyManager.NETWORK_TYPE_HSPA,
      TelephonyManager.NETWORK_TYPE_EVDO_B,
      TelephonyManager.NETWORK_TYPE_EHRPD,
      TelephonyManager.NETWORK_TYPE_HSPAP -> {
        CellularGeneration.CG_3G
      }
      TelephonyManager.NETWORK_TYPE_LTE -> {
        CellularGeneration.CG_4G
      }
      TelephonyManager.NETWORK_TYPE_NR -> {
        CellularGeneration.CG_5G
      }
      else -> {
        CellularGeneration.UNKNOWN
      }
    }
  }
}
