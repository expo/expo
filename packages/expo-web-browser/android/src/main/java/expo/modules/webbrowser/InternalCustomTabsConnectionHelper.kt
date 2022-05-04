package expo.modules.webbrowser

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession
import expo.modules.core.interfaces.LifecycleEventListener

class InternalCustomTabsConnectionHelper internal constructor(
  private val context: Context
) : CustomTabsServiceConnection(), LifecycleEventListener, CustomTabsConnectionHelper {
  private var currentPackageName: String? = null
  private val clientActions = DeferredClientActionsQueue<CustomTabsClient>()
  private val sessionActions = DeferredClientActionsQueue<CustomTabsSession?>()

  // region Expo Internal Module + events implementation
  override fun getExportedInterfaces(): List<Class<*>?> {
    return listOf(CustomTabsConnectionHelper::class.java)
  }

  override fun onHostResume() = Unit

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    unbindService()
  }
  // endregion

  // region CustomTabsConnectionHelper implementation
  override fun warmUp(packageName: String) {
    clientActions.executeOrQueueAction { client: CustomTabsClient -> client.warmup(0) }
    ensureConnection(packageName)
  }

  override fun mayInitWithUrl(packageName: String, uri: Uri) {
    sessionActions.executeOrQueueAction { session: CustomTabsSession? ->
      session?.mayLaunchUrl(uri, null, null)
    }
    ensureConnection(packageName)
    ensureSession()
  }

  override fun coolDown(packageName: String): Boolean {
    if (packageName == currentPackageName) {
      unbindService()
      return true
    }
    return false
  }
  // endregion

  // region CustomTabsServiceConnection implementation
  override fun onBindingDied(componentName: ComponentName) {
    if (componentName.packageName == currentPackageName) {
      clearConnection()
    }
  }

  override fun onCustomTabsServiceConnected(componentName: ComponentName, client: CustomTabsClient) {
    if (componentName.packageName == currentPackageName) {
      clientActions.setClient(client)
    }
  }

  override fun onServiceDisconnected(componentName: ComponentName) {
    if (componentName.packageName == currentPackageName) {
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
    if (!connectionStarted(packageName)) {
      CustomTabsClient.bindCustomTabsService(context, packageName, this)
      currentPackageName = packageName
    }
  }

  private fun connectionStarted(packageName: String): Boolean {
    return packageName == currentPackageName
  }

  private fun unbindService() {
    context.unbindService(this)
    clearConnection()
  }

  private fun clearConnection() {
    currentPackageName = null
    clientActions.clear()
    sessionActions.clear()
  }
}
