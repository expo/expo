package abi43_0_0.expo.modules.cellular

import android.annotation.SuppressLint
import android.content.Context
import android.net.sip.SipManager
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log
import abi43_0_0.expo.modules.core.ExportedModule
import abi43_0_0.expo.modules.core.Promise
import abi43_0_0.expo.modules.core.interfaces.ExpoMethod
import abi43_0_0.expo.modules.core.interfaces.RegistryLifecycleListener
import java.util.*

class CellularModule(private val mContext: Context) : ExportedModule(mContext), RegistryLifecycleListener {
  override fun getName(): String = "ExpoCellular"

  private fun telephonyManager() =
    (mContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
      it?.simState == TelephonyManager.SIM_STATE_READY
    }

  override fun getConstants() =
    HashMap<String, Any?>().apply {
      val telephonyManager = telephonyManager()
      put("allowsVoip", SipManager.isVoipSupported(mContext))
      put("isoCountryCode", telephonyManager?.simCountryIso)
      put("carrier", telephonyManager?.simOperatorName)
      put("mobileCountryCode", telephonyManager?.simOperator?.substring(0, 3))
      put("mobileNetworkCode", telephonyManager?.simOperator?.substring(3))
    }

  @ExpoMethod
  fun getCellularGenerationAsync(promise: Promise) {
    try {
      promise.resolve(getCurrentGeneration())
    } catch (e: SecurityException) {
      Log.w(name, "READ_PHONE_STATE permission is required to acquire network type", e)
      promise.resolve(CellularGeneration.UNKNOWN.value)
    }
  }

  @ExpoMethod
  fun allowsVoipAsync(promise: Promise) {
    promise.resolve(SipManager.isVoipSupported(mContext))
  }

  @ExpoMethod
  fun getIsoCountryCodeAsync(promise: Promise) {
    val telephonyManager = telephonyManager()
    promise.resolve(telephonyManager?.simCountryIso)
  }

  @ExpoMethod
  fun getCarrierNameAsync(promise: Promise) {
    val telephonyManager = telephonyManager()
    promise.resolve(telephonyManager?.simOperatorName)
  }

  @ExpoMethod
  fun getMobileCountryCodeAsync(promise: Promise) {
    val telephonyManager = telephonyManager()
    promise.resolve(telephonyManager?.simOperator?.substring(0, 3))
  }

  @ExpoMethod
  fun getMobileNetworkCodeAsync(promise: Promise) {
    val telephonyManager = telephonyManager()
    promise.resolve(telephonyManager?.simOperator?.substring(3))
  }

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
