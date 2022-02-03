package abi44_0_0.expo.modules.cellular

import android.annotation.SuppressLint
import android.content.Context
import android.net.sip.SipManager
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log
import abi44_0_0.expo.modules.kotlin.modules.Module
import abi44_0_0.expo.modules.kotlin.modules.ModuleDefinition

const val moduleName = "ExpoCellular"

class CellularModule : Module() {
  override fun definition() = ModuleDefinition {
    name(moduleName)
    constants {
      val telephonyManager = telephonyManager()
      mapOf(
        "allowsVoip" to SipManager.isVoipSupported(context),
        "isoCountryCode" to telephonyManager?.simCountryIso,
        "carrier" to telephonyManager?.simOperatorName,
        "mobileCountryCode" to telephonyManager?.simOperator?.substring(0, 3),
        "mobileNetworkCode" to telephonyManager?.simOperator?.substring(3)
      )
    }

    function("getCellularGenerationAsync") {
      try {
        getCurrentGeneration()
      } catch (e: SecurityException) {
        Log.w(moduleName, "READ_PHONE_STATE permission is required to acquire network type", e)
        CellularGeneration.UNKNOWN.value
      }
    }

    function("allowsVoipAsync") {
      SipManager.isVoipSupported(context)
    }

    function("getIsoCountryCodeAsync") {
      telephonyManager()?.simCountryIso
    }

    function("getCarrierNameAsync") {
      telephonyManager()?.simOperatorName
    }

    function("getMobileCountryCodeAsync") {
      telephonyManager()?.simOperator?.substring(0, 3)
    }

    function("getMobileNetworkCodeAsync") {
      telephonyManager()?.simOperator?.substring(3)
    }
  }

  private fun telephonyManager() =
    (context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
      it?.simState == TelephonyManager.SIM_STATE_READY
    }

  private val context
    get() = requireNotNull(appContext.reactContext)

  @SuppressLint("MissingPermission")
  private fun getCurrentGeneration(): Int {
    val telephonyManager = telephonyManager()
      ?: return CellularGeneration.UNKNOWN.value
    val networkType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      telephonyManager.dataNetworkType
    } else {
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
      else -> {
        CellularGeneration.UNKNOWN.value
      }
    }
  }
}
