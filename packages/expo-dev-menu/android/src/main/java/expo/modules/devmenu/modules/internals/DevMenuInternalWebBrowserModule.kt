package expo.modules.devmenu.modules.internals

import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.devmenu.modules.DevMenuInternalWebBrowserModuleInterface

class DevMenuInternalWebBrowserModule(private val reactContext: ReactApplicationContext) :
  DevMenuInternalWebBrowserModuleInterface {
  override fun openWebBrowserAsync(startUrl: String?, promise: Promise) {
    requireNotNull(startUrl)

    val intent = createCustomTabsIntent()
    intent.data = Uri.parse(startUrl)

    reactContext.currentActivity?.let {
      it.startActivity(intent)
      promise.resolve(null)
      return
    }

    promise.reject("ERR_DEVMENU_CANNOT_OPEN_BROWSER", "Current activity is null.")
  }

  private fun createCustomTabsIntent(): Intent {
    val builder = CustomTabsIntent.Builder()
    builder.setShowTitle(false)

    val intent = builder.build().intent

    // We cannot use builder's method enableUrlBarHiding, because there is no corresponding disable method and some browsers enables it by default.
    intent.putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, false)

    return intent
  }
}
