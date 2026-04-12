package expo.modules.network

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telephony.CellSignalStrength
import android.util.Log
import androidx.core.content.ContextCompat

private val TAG = WifiSignalStrengthMonitor::class.java.simpleName
private const val CONNECTIVITY_CHANGE_DELAY_MS = 150L

internal class WifiSignalStrengthMonitor(
  private val context: Context,
  private val connectivityManager: ConnectivityManager,
  private val onStrengthChanged: (Int) -> Unit
) {
  private val wifiManager: WifiManager =
    context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

  private val handler = Handler(Looper.getMainLooper())
  private var pendingUpdate: Runnable? = null

  private fun delayedUpdate() {
    pendingUpdate?.let { handler.removeCallbacks(it) }
    val runnable = Runnable { onStrengthChanged(getCurrentStrength()) }
    pendingUpdate = runnable
    handler.postDelayed(runnable, CONNECTIVITY_CHANGE_DELAY_MS)
  }

  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    override fun onAvailable(network: Network) {
      delayedUpdate()
    }

    override fun onLost(network: Network) {
      delayedUpdate()
    }

    override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
      delayedUpdate()
    }
  }

  @Suppress("DEPRECATION")
  private val broadcastReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action == ConnectivityManager.CONNECTIVITY_ACTION) {
        delayedUpdate()
      }
    }
  }

  fun getCurrentStrength(): Int {
    if (!hasWifiStatePermission()) {
      Log.e(TAG, "Not permitted to get Wi-Fi signal strength!")
      return INVALID_SIGNAL_STRENGTH
    }

    @Suppress("DEPRECATION")
    val wifiInfo = wifiManager.connectionInfo
      ?: return CellSignalStrength.SIGNAL_STRENGTH_NONE_OR_UNKNOWN

    @Suppress("DEPRECATION")
    val rssi = wifiInfo.rssi

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val qualityRating = wifiManager.calculateSignalLevel(rssi)
      val maxSignalLevel = wifiManager.maxSignalLevel

      if (maxSignalLevel == CellSignalStrength.SIGNAL_STRENGTH_GREAT) {
        qualityRating
      } else {
        Math.round((qualityRating / maxSignalLevel.toFloat()) * CellSignalStrength.SIGNAL_STRENGTH_GREAT)
      }
    } else {
      @Suppress("DEPRECATION")
      WifiManager.calculateSignalLevel(rssi, CellSignalStrength.SIGNAL_STRENGTH_GREAT + 1)
    }
  }

  private fun hasWifiStatePermission(): Boolean {
    return ContextCompat.checkSelfPermission(
      context,
      Manifest.permission.ACCESS_WIFI_STATE
    ) == PackageManager.PERMISSION_GRANTED
  }

  fun register() {
    val wifiNetworkRequest = NetworkRequest.Builder()
      .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
      .build()
    try {
      connectivityManager.registerNetworkCallback(wifiNetworkRequest, networkCallback)
    } catch (e: RuntimeException) {
      Log.e(TAG, "Failed to register Wi-Fi network callback!", e)
    }

    @Suppress("DEPRECATION")
    val filter = IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(broadcastReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("DEPRECATION")
      context.registerReceiver(broadcastReceiver, filter)
    }
  }

  fun unregister() {
    pendingUpdate?.let { handler.removeCallbacks(it) }
    pendingUpdate = null
    try {
      context.unregisterReceiver(broadcastReceiver)
    } catch (e: IllegalArgumentException) {
      // Receiver was not registered
    }
    try {
      connectivityManager.unregisterNetworkCallback(networkCallback)
    } catch (e: IllegalArgumentException) {
      // Callback was not registered
    }
  }
}
