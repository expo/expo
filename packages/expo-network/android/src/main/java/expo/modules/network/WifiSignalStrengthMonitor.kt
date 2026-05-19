package expo.modules.network

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.telephony.CellSignalStrength
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import java.lang.ref.WeakReference
import kotlin.math.roundToInt

private val TAG = WifiSignalStrengthMonitor::class.simpleName
private const val CONNECTIVITY_CHANGE_DELAY_MS = 150L

internal class WifiSignalStrengthMonitor(
  context: Context,
  private val connectivityManager: ConnectivityManager,
  onStrengthChanged: (Int) -> Unit
) : Monitor<Int>(onStrengthChanged) {
  private val contextRef = WeakReference(context)
  private val wifiManager: WifiManager =
    context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    // Per docs calling getStrengthFromCapabilities() from onAvailable()
    // may lead to a race condition

    override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
      delayedUpdate(
        getStrength(networkCapabilities),
        CONNECTIVITY_CHANGE_DELAY_MS
      )
    }

    override fun onLost(network: Network) {
      // No worries about race condition because we're not using
      // ConnectivityManager methods
      delayedUpdate(
        CellSignalStrength.SIGNAL_STRENGTH_NONE_OR_UNKNOWN,
        CONNECTIVITY_CHANGE_DELAY_MS
      )
    }
  }

  fun getStrength(capabilities: NetworkCapabilities): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      getStrengthFromCapabilities(capabilities)
    } else {
      getStrengthForLegacy()
    }
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  fun getStrengthFromCapabilities(capabilities: NetworkCapabilities): Int {
    val transportInfo = capabilities.transportInfo ?: return getErrorValue()
    if (transportInfo !is WifiInfo) {
      Log.e(TAG, "expo-network requested info about Wi-Fi networks but get transport info of type: " + transportInfo::class.simpleName)
      return getErrorValue()
    }

    return getStrengthFromInfo(transportInfo)
  }

  fun getStrengthForLegacy(): Int {
    if (!hasWifiConnectionInfoPerms()) {
      Log.e(TAG, "expo-network does not have permission to get info about Wi-Fi connection!")
      return getErrorValue()
    }

    try {
      val wifiInfo = wifiManager.connectionInfo
        ?: return CellSignalStrength.SIGNAL_STRENGTH_NONE_OR_UNKNOWN

      return getStrengthFromInfo(wifiInfo)
    } catch (e: Exception) {
      Log.e(TAG, "expo-network encountered an error while trying to retrieve Wi-Fi connection info!", e)
      return getErrorValue()
    }
  }

  fun getStrengthFromInfo(wifiInfo: WifiInfo): Int {
    val rssi = wifiInfo.rssi

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val qualityRating = wifiManager.calculateSignalLevel(rssi)
      val maxSignalLevel = wifiManager.maxSignalLevel

      if (maxSignalLevel == CellSignalStrength.SIGNAL_STRENGTH_GREAT) {
        qualityRating
      } else {
        if (maxSignalLevel <= 0) {
          Log.w(TAG, "Invalid max signal level: $maxSignalLevel. Returning raw signal level: $qualityRating")
          qualityRating
        } else {
          ((qualityRating / maxSignalLevel.toFloat()) * CellSignalStrength.SIGNAL_STRENGTH_GREAT).roundToInt()
        }
      }
    } else {
      @Suppress("DEPRECATION")
      WifiManager.calculateSignalLevel(rssi, CellSignalStrength.SIGNAL_STRENGTH_GREAT + 1)
    }
  }

  private fun hasWifiConnectionInfoPerms(): Boolean {
    val ctx = contextRef.get() ?: return false
    return (
      ContextCompat.checkSelfPermission(
        ctx,
        Manifest.permission.ACCESS_WIFI_STATE
      ) == PackageManager.PERMISSION_GRANTED
      ) && (
      ContextCompat.checkSelfPermission(
        ctx,
        Manifest.permission.ACCESS_FINE_LOCATION
      ) == PackageManager.PERMISSION_GRANTED
      )
  }

  private fun hasNetworkStatePermission(): Boolean {
    val ctx = contextRef.get() ?: return false
    return ContextCompat.checkSelfPermission(
      ctx,
      Manifest.permission.ACCESS_NETWORK_STATE
    ) == PackageManager.PERMISSION_GRANTED
  }

  override fun register() {
    // Permission required for registerNetworkCallback()
    if (!hasNetworkStatePermission()) {
      Log.e(TAG, "expo-network does not have permission to monitor Wi-Fi signal strength!")
      return
    }

    val wifiNetworkRequest = NetworkRequest.Builder()
      .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
      .build()

    try {
      connectivityManager.registerNetworkCallback(wifiNetworkRequest, networkCallback)
    } catch (e: RuntimeException) {
      Log.e(TAG, "expo-network failed to register Wi-Fi network callback because the app already has too many callbacks registered!", e)
    }
  }

  override fun getErrorValue(): Int = INVALID_SIGNAL_STRENGTH

  override fun internalUnregister() {
    try {
      connectivityManager.unregisterNetworkCallback(networkCallback)
    } catch (_: Exception) {
      // Callback was not registered
    }
  }
}
