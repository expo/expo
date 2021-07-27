package expo.modules.cellular

import android.annotation.SuppressLint
import android.content.Context
import android.net.sip.SipManager
import android.os.Build
import android.telephony.TelephonyManager
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.RegistryLifecycleListener
import java.util.*

class CellularModule(private val mContext: Context) : ExportedModule(mContext), RegistryLifecycleListener {
  override fun getName(): String = "ExpoCellular"

  override fun getConstants(): HashMap<String, Any?> {
    val telephonyManager =
      (mContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
        it?.simState == TelephonyManager.SIM_STATE_READY
      }

    return HashMap<String, Any?>().apply {
      put("allowsVoip", SipManager.isVoipSupported(mContext))
      put("isoCountryCode", telephonyManager?.simCountryIso)
      put("carrier", telephonyManager?.simOperatorName)
      put("mobileCountryCode", telephonyManager?.simOperator?.substring(0, 3))
      put("mobileNetworkCode", telephonyManager?.simOperator?.substring(3))
    }
  }

  @SuppressLint("MissingPermission")
  @ExpoMethod
  fun getCellularGenerationAsync(promise: Promise) {
    try {
      val telephonyManager =
        mContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
      if (telephonyManager == null) {
        promise.resolve(CellularGeneration.UNKNOWN.value)
        return
      }
      val networkType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        telephonyManager.dataNetworkType
      } else {
        telephonyManager.networkType
      }
      when (networkType) {
        TelephonyManager.NETWORK_TYPE_GPRS,
        TelephonyManager.NETWORK_TYPE_EDGE,
        TelephonyManager.NETWORK_TYPE_CDMA,
        TelephonyManager.NETWORK_TYPE_1xRTT,
        TelephonyManager.NETWORK_TYPE_IDEN -> {
          promise.resolve(CellularGeneration.CG_2G.value)
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
          promise.resolve(CellularGeneration.CG_3G.value)
        }
        TelephonyManager.NETWORK_TYPE_LTE -> {
          promise.resolve(CellularGeneration.CG_4G.value)
        }
        TelephonyManager.NETWORK_TYPE_NR -> {
          promise.resolve(CellularGeneration.CG_5G.value)
        }
        else -> promise.resolve(CellularGeneration.UNKNOWN.value)
      }
    } catch (e: Exception) {
      promise.reject("ERR_CELLULAR_GENERATION_UNKNOWN_NETWORK_TYPE", "Unable to access network type or not connected to a cellular network", e)
    }
  }
}
