package expo.modules.appauth

import android.net.Uri
import net.openid.appauth.connectivity.ConnectionBuilder
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

// This cannot support a more robust unsafe connection builder due to Google Play Store restrictions.
// See more https://support.google.com/faqs/answer/6346016?hl=en
class UnsafeConnectionBuilder : ConnectionBuilder {
  @Throws(IOException::class)
  override fun openConnection(uri: Uri): HttpURLConnection {
    return URL(uri.toString()).openConnection() as HttpURLConnection
  }

  companion object {
    val INSTANCE = UnsafeConnectionBuilder()
  }
}