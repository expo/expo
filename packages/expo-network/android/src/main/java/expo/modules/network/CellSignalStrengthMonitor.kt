package expo.modules.network

import android.content.Context
import android.os.Build
import android.telephony.CellSignalStrength
import android.telephony.PhoneStateListener
import android.telephony.SignalStrength
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.annotation.RequiresApi

internal const val INVALID_SIGNAL_STRENGTH = -1

private val TAG = CellSignalStrengthMonitor::class.java.simpleName

internal class CellSignalStrengthMonitor(
  private val context: Context,
  private val onStrengthChanged: (Int) -> Unit
) {
  private val telephonyManager: TelephonyManager =
    context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

  private val callback: Any = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    ModernTelephonyCallback()
  } else {
    LegacyPhoneStateListener()
  }

  fun getCurrentStrength(): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      return try {
        telephonyManager.signalStrength?.level ?: CellSignalStrength.SIGNAL_STRENGTH_NONE_OR_UNKNOWN
      } catch (e: UnsupportedOperationException) {
        Log.e(TAG, "Missing FEATURE_TELEPHONY_RADIO_ACCESS!", e)
        INVALID_SIGNAL_STRENGTH
      }
    }
    return INVALID_SIGNAL_STRENGTH
  }

  fun register() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      telephonyManager.registerTelephonyCallback(
        context.mainExecutor,
        callback as TelephonyCallback
      )
    } else {
      @Suppress("DEPRECATION")
      telephonyManager.listen(
        callback as PhoneStateListener,
        PhoneStateListener.LISTEN_SIGNAL_STRENGTHS
      )
    }
  }

  fun unregister() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      telephonyManager.unregisterTelephonyCallback(callback as TelephonyCallback)
    } else {
      @Suppress("DEPRECATION")
      telephonyManager.listen(
        callback as PhoneStateListener,
        PhoneStateListener.LISTEN_NONE
      )
    }
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private inner class ModernTelephonyCallback :
    TelephonyCallback(), TelephonyCallback.SignalStrengthsListener {
    override fun onSignalStrengthsChanged(signalStrength: SignalStrength) {
      onStrengthChanged(signalStrength.level)
    }
  }

  @Suppress("DEPRECATION")
  private inner class LegacyPhoneStateListener : PhoneStateListener() {
    override fun onSignalStrengthsChanged(signalStrength: SignalStrength) {
      onStrengthChanged(signalStrength.level)
    }
  }
}
