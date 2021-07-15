package expo.modules.cellular

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.net.sip.SipManager
import android.os.Build
import android.telephony.TelephonyManager
import expo.modules.interfaces.permissions.Permissions
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.ModuleRegistryDelegate
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.RegistryLifecycleListener
import kotlin.collections.HashMap


class CellularModule(
  private val mContext: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate(),
) : ExportedModule(mContext), RegistryLifecycleListener {
  private val mPermissions: Permissions by moduleRegistry()

  override fun getName(): String = "ExpoCellular"

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getConstants(): HashMap<String, Any?> {
    val constants = HashMap<String, Any?>()
    constants["allowsVoip"] = SipManager.isVoipSupported(mContext)
    val telephonyManager = mContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    constants["isoCountryCode"] = telephonyManager.simCountryIso

    //check if sim state is ready
    if (telephonyManager.simState == TelephonyManager.SIM_STATE_READY) {
      constants["carrier"] = telephonyManager.simOperatorName
      constants["mobileCountryCode"] = telephonyManager.simOperator.substring(0, 3)
      constants["mobileNetworkCode"] = StringBuilder(telephonyManager.simOperator).delete(0, 3).toString()
    } else {
      constants["carrier"] = null
      constants["mobileCountryCode"] = null
      constants["mobileNetworkCode"] = null
    }
    return constants
  }

  @ExpoMethod
  fun requestPhoneStatePermissionsAsync(promise: Promise?) {
    mPermissions.askForPermissionsWithPromise(promise, Manifest.permission.READ_PHONE_STATE)
  }

  @ExpoMethod
  fun getPhoneStatePermissionsAsync(promise: Promise) {
    mPermissions.getPermissionsWithPromise(promise, Manifest.permission.READ_PHONE_STATE)
  }

  @ExpoMethod
  fun getCellularGenerationAsync(promise: Promise) {
    try {
      val networkType = getNetworkGeneration()
      promise.resolve(networkType)
    } catch (e: SecurityException) {
      promise.reject("E_MISSING_PERMISSIONS", e)
    } catch (e: Exception) {
      promise.reject("ERR_CELLULAR_GENERATION_UNKNOWN_NETWORK_TYPE", "Unable to access network type or not connected to a cellular network", e)
    }
  }

  @ExpoMethod
  fun getCurrentCarrierAsync(promise: Promise) {
    val carrierInfo = HashMap<String, Any?>()
    carrierInfo["allowsVoip"] = SipManager.isVoipSupported(mContext)
    val telephonyManager = mContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    carrierInfo["isoCountryCode"] = telephonyManager.simCountryIso

    if (telephonyManager.simState == TelephonyManager.SIM_STATE_READY) {
      carrierInfo["carrier"] = telephonyManager.simOperatorName
      carrierInfo["mobileCountryCode"] = telephonyManager.simOperator.take(3)
      carrierInfo["mobileNetworkCode"] = StringBuilder(telephonyManager.simOperator).delete(0, 3).toString()
      carrierInfo["generation"] = getNetworkGeneration()
    } else {
      carrierInfo["carrier"] = null
      carrierInfo["mobileCountryCode"] = null
      carrierInfo["mobileNetworkCode"] = null
      carrierInfo["generation"] = null
    }
  }

  @SuppressLint("MissingPermission")
  private fun getNetworkGeneration(): Int {
    if (checkPermissions()) {
      val mTelephonyManager = mContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
      val networkType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        mTelephonyManager.dataNetworkType
      } else {
        @Suppress("DEPRECATION")
        mTelephonyManager.networkType
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
        else -> CellularGeneration.UNKNOWN.value
      }
    }
    return -1
  }

  private fun checkPermissions(): Boolean {
    if (!mPermissions.hasGrantedPermissions(Manifest.permission.READ_PHONE_STATE)) {
      throw SecurityException("READ_PHONE_STATE permission is required to do this operation.")
    }
    return true
  }



}
