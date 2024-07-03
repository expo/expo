package expo.modules.cellular

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.net.sip.SipManager
import android.os.Build
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
    Constants {
      val telephonyManager = telephonyManager()
      mapOf(
        "allowsVoip" to SipManager.isVoipSupported(context),
        "isoCountryCode" to telephonyManager?.simCountryIso,
        "carrier" to telephonyManager?.simOperatorName,
        "mobileCountryCode" to telephonyManager?.simOperator?.substring(0, 3),
        "mobileNetworkCode" to telephonyManager?.simOperator?.substring(3)
      )
    }

    AsyncFunction<Int>("getCellularGenerationAsync") {
      try {
        getCurrentGeneration()
      } catch (e: SecurityException) {
        Log.w(moduleName, "READ_PHONE_STATE permission is required to acquire network type", e)
        CellularGeneration.UNKNOWN.value
      }
    }

    AsyncFunction<Boolean>("allowsVoipAsync") {
      SipManager.isVoipSupported(context)
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
    val networkType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      telephonyManager.dataNetworkType
    } else {
      @Suppress("DEPRECATION")
      telephonyManager.networkType
    }
    return when (networkType) {
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
