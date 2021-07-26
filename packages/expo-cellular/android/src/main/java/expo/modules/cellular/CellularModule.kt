package expo.modules.cellular

import android.annotation.SuppressLint
import android.content.Context
import android.net.sip.SipManager
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log
import org.unimodules.core.ExportedModule
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.RegistryLifecycleListener
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

  @ExpoMethod
  fun getCellularGenerationAsync(promise: Promise) {
    try {
      val telephonyManager = mContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
      promise.resolve(getCurrentGeneration(telephonyManager))
    } catch (e: Exception) {
      Log.i(name, "Unable to access network type or not connected to a cellular network", e)
      promise.resolve(CellularGeneration.UNKNOWN.value)
    }
  }

  @ExpoMethod
  fun allowsVoipAsync(promise: Promise) {
    try {
      promise.resolve(SipManager.isVoipSupported(mContext))
    } catch (e: Exception) {
      Log.i(name, "Unable to access network type or not connected to a cellular network", e)
      promise.resolve(false)
    }
  }

  @ExpoMethod
  fun getIsoCountryCodeAsync(promise: Promise) {
    try {
      val telephonyManager =
        (mContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
          it?.simState == TelephonyManager.SIM_STATE_READY
        }
      promise.resolve(telephonyManager?.simCountryIso)
    } catch (e: Exception) {
      Log.i(name, "Unable to access network type or not connected to a cellular network", e)
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getCarrierNameAsync(promise: Promise) {
    try {
      val telephonyManager =
        (mContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
          it?.simState == TelephonyManager.SIM_STATE_READY
        }
      promise.resolve(telephonyManager?.simOperatorName)
    } catch (e: Exception) {
      Log.i(name, "Unable to access network type or not connected to a cellular network", e)
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getMobileCountryCodeAsync(promise: Promise) {
    try {
      val telephonyManager =
        (mContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
          it?.simState == TelephonyManager.SIM_STATE_READY
        }
      promise.resolve(telephonyManager?.simOperator?.substring(0, 3))
    } catch (e: Exception) {
      Log.i(name, "Unable to access network type or not connected to a cellular network", e)
      promise.resolve(null)
    }
  }

  @ExpoMethod
  fun getMobileNetworkCodeAsync(promise: Promise) {
    try {
      val telephonyManager =
        (mContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager).takeIf {
          it?.simState == TelephonyManager.SIM_STATE_READY
        }
      promise.resolve(telephonyManager?.simOperator?.substring(3))
    } catch (e: Exception) {
      Log.i(name, "Unable to access network type or not connected to a cellular network", e)
      promise.resolve(null)
    }
  }

  @SuppressLint("MissingPermission")
  private fun getCurrentGeneration(telephonyManager: TelephonyManager?): Int {
    if (telephonyManager == null) {
      return CellularGeneration.UNKNOWN.value
    }
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
