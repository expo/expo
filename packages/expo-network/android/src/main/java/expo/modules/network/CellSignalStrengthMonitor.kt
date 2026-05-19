package expo.modules.network

import android.content.Context
import android.os.Build
import android.telephony.PhoneStateListener
import android.telephony.SignalStrength
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.annotation.RequiresApi
import java.lang.ref.WeakReference

private val TAG = CellSignalStrengthMonitor::class.simpleName

internal const val INVALID_SIGNAL_STRENGTH = -1

internal class CellSignalStrengthMonitor(
  context: Context,
  onStrengthChanged: (Int) -> Unit
) : Monitor<Int>(onStrengthChanged) {
  private val contextRef = WeakReference(context)
  private val telephonyManager: TelephonyManager =
    context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

  private val callback: SignalStrengthListener = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    ModernTelephonyCallback()
  } else {
    LegacyPhoneStateListener()
  }

  override fun register() {
    val ctx = contextRef.get()

    if (ctx == null) {
      Log.e(TAG, "expo-network failed to follow reference to app context!")
      return
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      try {
        telephonyManager.registerTelephonyCallback(
          ctx.mainExecutor,
          callback as TelephonyCallback
        )
      } catch (e: SecurityException) {
        Log.e(TAG, "expo-network does not have permissions to listen for cell signal strength!", e)
      }
    } else {
      try {
        @Suppress("DEPRECATION")
        telephonyManager.listen(
          callback as PhoneStateListener,
          PhoneStateListener.LISTEN_SIGNAL_STRENGTHS
        )
      } catch (e: IllegalStateException) {
        Log.e(TAG, "expo-network cannot listen for cell signal strength because too many listeners have been registered!", e)
      }
    }
  }

  override fun internalUnregister() {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        telephonyManager.unregisterTelephonyCallback(callback as TelephonyCallback)
      } else {
        @Suppress("DEPRECATION")
        telephonyManager.listen(
          callback as PhoneStateListener,
          PhoneStateListener.LISTEN_NONE
        )
      }
    } catch (_: Exception) {
      // No worries if error on teardown
    }
  }

  // Common interface between modern and legacy signal strength listeners
  interface SignalStrengthListener {
    fun onSignalStrengthsChanged(signalStrength: SignalStrength)
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private inner class ModernTelephonyCallback :
    TelephonyCallback(), TelephonyCallback.SignalStrengthsListener, SignalStrengthListener {
    override fun onSignalStrengthsChanged(signalStrength: SignalStrength) {
      update(signalStrength.level)
    }
  }

  @Suppress("DEPRECATION")
  private inner class LegacyPhoneStateListener : PhoneStateListener(), SignalStrengthListener {
    override fun onSignalStrengthsChanged(signalStrength: SignalStrength) {
      update(signalStrength.level)
    }
  }

  override fun getErrorValue(): Int = INVALID_SIGNAL_STRENGTH
}
