// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.network

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.content.edit
import java.net.URI

/**
 * Android 17 gates local network access behind a runtime permission. Expo Go declares it, so the
 * implicit grant older apps keep no longer applies, and Home has to ask before reaching a dev server
 * or discovering one over NSD. Loopback, and so `adb reverse`, is exempt.
 */
object LocalNetworkPermission {
  const val PERMISSION = "android.permission.ACCESS_LOCAL_NETWORK"

  private const val FIRST_ENFORCED_SDK = 37 // Android 17
  private const val PREFS = "expo.localnetwork"
  private const val KEY_PROMPTED = "prompted"

  fun isRequired(): Boolean = Build.VERSION.SDK_INT >= FIRST_ENFORCED_SDK

  fun isGranted(context: Context): Boolean =
    !isRequired() ||
      ContextCompat.checkSelfPermission(context, PERMISSION) == PackageManager.PERMISSION_GRANTED

  /**
   * False once the system has stopped showing the prompt, after the user denied it twice, so callers
   * send the user to Settings instead of launching a request that returns immediately.
   */
  fun canPrompt(context: Context): Boolean {
    val activity = context.findActivity() ?: return true
    val promptedBefore = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_PROMPTED, false)
    return !promptedBefore || activity.shouldShowRequestPermissionRationale(PERMISSION)
  }

  fun markPrompted(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit { putBoolean(KEY_PROMPTED, true) }
  }

  /** Whether opening this URL reaches a host on the local network. Malformed URLs are not local. */
  fun isLocalNetworkUrl(url: String): Boolean {
    val host = try {
      URI(url).host
    } catch (e: Exception) {
      null
    } ?: return false
    return isLocalNetworkHost(host)
  }

  /** Private IPv4 ranges, link-local IPv4 and IPv6, and mDNS `.local` names. */
  fun isLocalNetworkHost(host: String): Boolean {
    val bare = host.trim('[', ']').lowercase()
    if (bare.endsWith(".local") || bare.startsWith("fe80:")) {
      return true
    }
    val octets = bare.split('.')
    if (octets.size != 4) {
      return false
    }
    val (a, b) = octets.map { it.toIntOrNull()?.takeIf { value -> value in 0..255 } ?: return false }
    return a == 10 ||
      (a == 172 && b in 16..31) ||
      (a == 192 && b == 168) ||
      (a == 169 && b == 254)
  }

  private fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
  }
}
