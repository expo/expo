package host.exp.exponent.nsd

import android.net.nsd.NsdServiceInfo
import android.os.Build
import java.net.Inet4Address

private fun NsdServiceInfo.getHostIpv4(): Inet4Address? {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
    hostAddresses.filterIsInstance<Inet4Address>().firstOrNull()
  } else {
    @Suppress("DEPRECATION")
    host as? Inet4Address
  }
}

fun NsdServiceInfo.getUrl(): String? {
  val hostIp = getHostIpv4() ?: return null
  val port = port
  return "http://${hostIp.hostAddress}:$port"
}

fun NsdServiceInfo.getAttribute(attributeName: String): String? {
  val attributes = attributes ?: return null
  val attributeValue = attributes[attributeName] ?: return null
  return String(attributeValue, Charsets.UTF_8)
}
