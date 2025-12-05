package expo.modules.webbrowser

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.net.toUri

/**
 * Trampoline Activity that serves as a proxy to launch Custom Tabs in a separate task.
 */
class BrowserProxyActivity : Activity() {
  companion object {
    const val EXTRA_URL = "expo.modules.webbrowser.EXTRA_URL"
    const val EXTRA_CUSTOM_TABS_INTENT_DATA = "expo.modules.webbrowser.EXTRA_CUSTOM_TABS_INTENT_DATA"
  }

  private var hasLaunchedCustomTab = false
  private var wasPaused = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (savedInstanceState != null) {
      return
    }

    val url = intent.getStringExtra(EXTRA_URL)
    val customTabsIntentData: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent.getParcelableExtra(EXTRA_CUSTOM_TABS_INTENT_DATA, Intent::class.java)
    } else {
      @Suppress("DEPRECATION")
      intent.getParcelableExtra(EXTRA_CUSTOM_TABS_INTENT_DATA)
    }

    if (url == null || customTabsIntentData == null) {
      finish()
      return
    }

    val customTabsIntent = CustomTabsIntent.Builder().build()

    customTabsIntentData.extras?.let { customTabsIntent.intent.putExtras(it) }
    customTabsIntentData.`package`?.let { customTabsIntent.intent.`package` = it }

    customTabsIntent.launchUrl(this, url.toUri())
    hasLaunchedCustomTab = true
  }

  override fun onResume() {
    super.onResume()

    // Only finish if we've been paused before (meaning the custom tab was shown and is now dismissed)
    // The first onResume happens right after onCreate before the custom tab shows up,
    // so we ignore that one
    if (hasLaunchedCustomTab && wasPaused) {
      returnToMainApp()
      finish()
    }
  }

  override fun onPause() {
    super.onPause()
    wasPaused = true
  }

  private fun returnToMainApp() {
    val packageManager = packageManager
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)

    if (launchIntent != null) {
      launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      startActivity(launchIntent)
    }
  }

  override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    outState.putBoolean("hasLaunchedCustomTab", hasLaunchedCustomTab)
    outState.putBoolean("wasPaused", wasPaused)
  }

  override fun onRestoreInstanceState(savedInstanceState: Bundle) {
    super.onRestoreInstanceState(savedInstanceState)
    hasLaunchedCustomTab = savedInstanceState.getBoolean("hasLaunchedCustomTab", false)
    wasPaused = savedInstanceState.getBoolean("wasPaused", false)
  }
}
