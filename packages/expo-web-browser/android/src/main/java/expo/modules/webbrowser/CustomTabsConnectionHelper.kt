package expo.modules.webbrowser

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession

internal class CustomTabsConnectionHelper(
  private val context: Context
) : CustomTabsServiceConnection() {
  private var currentPackageName: String? = null
  private val clientActions = DeferredClientActionsQueue<CustomTabsClient>()
  private val sessionActions = DeferredClientActionsQueue<CustomTabsSession?>()

  // region lifecycle methods
  fun destroy() = clearConnection()
  // endregion

  // region Actual connection helper methods
  fun warmUp(packageName: String) {
    clientActions.executeOrQueueAction { client: CustomTabsClient -> client.warmup(0) }
    ensureConnection(packageName)
  }

  fun mayInitWithUrl(packageName: String, uri: Uri) {
    sessionActions.executeOrQueueAction { session: CustomTabsSession? ->
      session?.mayLaunchUrl(uri, null, null)
    }
    ensureConnection(packageName)
    ensureSession()
  }

  fun coolDown(packageName: String): Boolean {
    if (isConnectionStarted(packageName)) {
      clearConnection()
      return true
    }
    return false
  }
  // endregion

  // region CustomTabsServiceConnection implementation
  override fun onBindingDied(componentName: ComponentName) {
    if (isConnectionStarted(componentName.packageName)) {
      clearConnection()
    }
  }

  override fun onCustomTabsServiceConnected(componentName: ComponentName, client: CustomTabsClient) {
    if (isConnectionStarted(componentName.packageName)) {
      clientActions.setClient(client)
    }
  }

  override fun onServiceDisconnected(componentName: ComponentName) {
    if (isConnectionStarted(componentName.packageName)) {
      clearConnection()
    }
  }
  // endregion

  private fun ensureSession() {
    if (sessionActions.hasClient()) {
      return
    }

    clientActions.executeOrQueueAction { client: CustomTabsClient ->
      sessionActions.setClient(client.newSession(null))
    }
  }

  private fun ensureConnection(packageName: String) {
    if (currentPackageName != null && currentPackageName != packageName) {
      clearConnection()
    }
    if (!isConnectionStarted(packageName)) {
      CustomTabsClient.bindCustomTabsService(context, packageName, this)
      currentPackageName = packageName
    }
  }

  private fun isConnectionStarted(packageName: String): Boolean {
    return packageName == currentPackageName
  }

  private fun clearConnection() {
    if (currentPackageName != null) {
      context.unbindService(this)
    }

    currentPackageName = null
    clientActions.clear()
    sessionActions.clear()
  }
}
