package expo.modules.webbrowser

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import androidx.browser.customtabs.CustomTabsCallback
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsService
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException

internal class CustomTabsConnectionHelper(
  private val context: Context
) : CustomTabsServiceConnection() {
  private var currentPackageName: String? = null
  private val clientActions = DeferredClientActionsQueue<CustomTabsClient>()
  private val sessionActions = DeferredClientActionsQueue<CustomTabsSession?>()
  private val handler = Handler(Looper.getMainLooper())
  private var pendingBrowserOpen: PendingBrowserOpen? = null

  private class PendingBrowserOpen(
    val promise: Promise,
    var open: ((CustomTabsSession) -> Bundle)?
  ) {
    var priorityConnection: ServiceConnection? = null
  }

  // region lifecycle methods
  @Synchronized
  fun destroy() = clearConnection()
  // endregion

  // region Actual connection helper methods
  @Synchronized
  fun warmUp(packageName: String) {
    clientActions.executeOrQueueAction { client: CustomTabsClient -> client.warmup(0) }
    ensureConnection(packageName)
  }

  @Synchronized
  fun mayInitWithUrl(packageName: String, uri: Uri) {
    sessionActions.executeOrQueueAction { session: CustomTabsSession? ->
      session?.mayLaunchUrl(uri, null, null)
    }
    ensureConnection(packageName)
    ensureSession()
  }

  @Synchronized
  fun coolDown(packageName: String): Boolean {
    if (isConnectionStarted(packageName)) {
      clearConnection()
      return true
    }
    return false
  }

  @Synchronized
  fun openWithHeaders(
    packageName: String,
    origin: Uri,
    promise: Promise,
    open: (CustomTabsSession) -> Bundle
  ) {
    if (pendingBrowserOpen != null) {
      throw BrowserHeadersException("A browser is awaiting origin verification. Wait for it to finish before opening another.")
    }
    if (!ensureConnection(packageName)) {
      throw BrowserHeadersException("Could not connect to the selected browser. Use a browser that supports Custom Tabs.")
    }

    val pending = PendingBrowserOpen(promise, open)
    pendingBrowserOpen = pending
    handler.postAtTime(
      {
        rejectPendingOpen(
          pending,
          BrowserHeadersException("Browser origin verification timed out. Check the browser's network access and Digital Asset Links configuration.")
        )
      },
      pending,
      SystemClock.uptimeMillis() + 30_000
    )
    // A separate connection keeps verification online without raising the prewarm binding's priority.
    val connection = object : ServiceConnection {
      override fun onServiceConnected(name: ComponentName, service: IBinder) {
        verifyOrigin(pending, origin)
      }

      override fun onServiceDisconnected(name: ComponentName) = Unit
    }
    pending.priorityConnection = connection
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      Context.BIND_AUTO_CREATE or Context.BIND_NOT_PERCEPTIBLE
    } else {
      Context.BIND_AUTO_CREATE
    }
    try {
      val intent = Intent(CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION).setPackage(packageName)
      if (!context.bindService(intent, connection, flags)) {
        releasePriorityConnection(pending)
        verifyOrigin(pending, origin)
      }
    } catch (error: Exception) {
      rejectPendingOpen(pending, error.toCodedException())
    }
  }

  @Synchronized
  private fun verifyOrigin(pending: PendingBrowserOpen, origin: Uri) {
    if (pendingBrowserOpen !== pending) {
      return
    }
    clientActions.executeOrQueueAction { client ->
      if (pendingBrowserOpen !== pending) {
        return@executeOrQueueAction
      }
      try {
        client.warmup(0)
        lateinit var session: CustomTabsSession
        val callback = object : CustomTabsCallback() {
          override fun onRelationshipValidationResult(
            relation: Int,
            requestedOrigin: Uri,
            result: Boolean,
            extras: Bundle?
          ) {
            if (relation != CustomTabsService.RELATION_USE_AS_ORIGIN || requestedOrigin != origin) {
              return
            }
            if (!result) {
              rejectPendingOpen(
                pending,
                BrowserHeadersException("The browser did not verify this app for the HTTPS origin. Check its Digital Asset Links configuration.")
              )
              return
            }
            openPendingBrowser(pending, session)
          }
        }
        session = client.newSession(callback)
          ?: throw BrowserHeadersException("The browser could not create a verification session. Use a browser that supports origin verification.")
        if (!session.validateRelationship(CustomTabsService.RELATION_USE_AS_ORIGIN, origin, null)) {
          rejectPendingOpen(
            pending,
            BrowserHeadersException("The browser rejected origin verification. Use a browser that supports Digital Asset Links.")
          )
        }
      } catch (error: Exception) {
        rejectPendingOpen(pending, error.toCodedException())
      }
    }
  }

  @Synchronized
  fun cancelPendingBrowserOpen() {
    pendingBrowserOpen?.let {
      rejectPendingOpen(it, BrowserHeadersException("The pending browser request was canceled. Open a new authentication session to try again."))
    }
  }
  // endregion

  // region CustomTabsServiceConnection implementation
  @Synchronized
  override fun onBindingDied(componentName: ComponentName) {
    if (isConnectionStarted(componentName.packageName)) {
      clearConnection()
    }
  }

  @Synchronized
  override fun onCustomTabsServiceConnected(componentName: ComponentName, client: CustomTabsClient) {
    if (isConnectionStarted(componentName.packageName)) {
      clientActions.setClient(client)
    }
  }

  @Synchronized
  override fun onServiceDisconnected(componentName: ComponentName) {
    if (isConnectionStarted(componentName.packageName)) {
      clearConnection()
    }
  }
  // endregion

  // Module calls and browser callbacks use different queues; cancellation must not race a launch.
  @Synchronized
  private fun openPendingBrowser(pending: PendingBrowserOpen, session: CustomTabsSession) {
    if (pendingBrowserOpen !== pending) {
      return
    }
    val open = checkNotNull(pending.open)
    pending.open = null
    pendingBrowserOpen = null
    handler.removeCallbacksAndMessages(pending)
    try {
      pending.promise.resolve(open(session))
    } catch (error: Exception) {
      pending.promise.reject(error.toCodedException())
    } finally {
      releasePriorityConnection(pending)
    }
  }

  @Synchronized
  private fun rejectPendingOpen(pending: PendingBrowserOpen, error: CodedException) {
    if (pendingBrowserOpen !== pending) {
      return
    }
    pending.open = null
    pendingBrowserOpen = null
    handler.removeCallbacksAndMessages(pending)
    releasePriorityConnection(pending)
    pending.promise.reject(error)
  }

  private fun releasePriorityConnection(pending: PendingBrowserOpen) {
    val connection = pending.priorityConnection ?: return
    pending.priorityConnection = null
    // Android registers the connection even when bindService returns false.
    context.unbindService(connection)
  }

  private fun ensureSession() {
    if (sessionActions.hasClient()) {
      return
    }

    clientActions.executeOrQueueAction { client: CustomTabsClient ->
      sessionActions.setClient(client.newSession(null))
    }
  }

  private fun ensureConnection(packageName: String): Boolean {
    if (currentPackageName != null && currentPackageName != packageName) {
      clearConnection()
    }
    if (!isConnectionStarted(packageName)) {
      val bound = CustomTabsClient.bindCustomTabsService(context, packageName, this)
      if (bound) {
        currentPackageName = packageName
      }
      return bound
    }
    return true
  }

  private fun isConnectionStarted(packageName: String): Boolean {
    return packageName == currentPackageName
  }

  private fun clearConnection() {
    pendingBrowserOpen?.let {
      rejectPendingOpen(it, BrowserHeadersException("The browser disconnected before opening. Open a new authentication session to try again."))
    }
    if (currentPackageName != null) {
      context.unbindService(this)
    }

    currentPackageName = null
    clientActions.clear()
    sessionActions.clear()
  }
}
