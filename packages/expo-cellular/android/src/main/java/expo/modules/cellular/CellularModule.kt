package expo.modules.cellular

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.telephony.TelephonyManager
import android.util.Log
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val moduleName = "ExpoCellular"

class CellularModule : Module() {
  override fun definition() = ModuleDefinition {
    Name(moduleName)

    AsyncFunction<Int>("getCellularGenerationAsync") {
      try {
        getCurrentGeneration()
      } catch (e: SecurityException) {
        Log.w(moduleName, "READ_PHONE_STATE permission is required to acquire network type", e)
        CellularGeneration.UNKNOWN.value
      }
    }

    AsyncFunction<String?>("getIsoCountryCodeAsync") {
      telephonyManager()?.simCountryIso
    }

    AsyncFunction<String?>("getCarrierNameAsync") {
      telephonyManager()?.simOperatorName
    }

    AsyncFunction<String?>("getMobileCountryCodeAsync") {
      telephonyManager()?.simOperator?.substring(0, 3)
    }

    AsyncFunction<String?>("getMobileNetworkCodeAsync") {
      telephonyManager()?.simOperator?.substring(3)
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.READ_PHONE_STATE
      )
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.READ_PHONE_STATE
      )
    }
  }

  private fun telephonyManager() =
    (context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
      it?.simState == TelephonyManager.SIM_STATE_READY
    }

  private val context
    get() = requireNotNull(appContext.reactContext)

  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()

  @SuppressLint("MissingPermission")
  private fun getCurrentGeneration(): Int {
    val telephonyManager = telephonyManager()
      ?: return CellularGeneration.UNKNOWN.value
    @Suppress("DEPRECATION") // Legacy CDMA constants are deprecated, but can still be returned on older devices, so we keep mapping them instead of returning UNKNOWN
    return when (telephonyManager.dataNetworkType) {
      TelephonyManager.NETWORK_TYPE_GPRS,
      TelephonyManager.NETWORK_TYPE_EDGE,
      TelephonyManager.NETWORK_TYPE_CDMA,
      TelephonyManager.NETWORK_TYPE_1xRTT,
      TelephonyManager.NETWORK_TYPE_IDEN -> {
        CellularGeneration.CG_2G.value
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
        CellularGeneration.CG_3G.value
      }
      TelephonyManager.NETWORK_TYPE_LTE -> {
        CellularGeneration.CG_4G.value
      }
      TelephonyManager.NETWORK_TYPE_NR -> {
        CellularGeneration.CG_5G.value
      }
      else -> {
        CellularGeneration.UNKNOWN.value
      }
    }
  }
}
