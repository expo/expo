package expo.modules.webbrowser

import android.net.Uri
import expo.modules.core.interfaces.InternalModule

interface CustomTabsConnectionHelper : InternalModule {
  fun warmUp(packageName: String)
  fun mayInitWithUrl(packageName: String, uri: Uri)
  fun coolDown(packageName: String): Boolean
}
