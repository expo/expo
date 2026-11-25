package expo.modules.webbrowser

import android.content.ComponentName
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.content.ServiceConnection
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.browser.customtabs.CustomTabsService
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession
import androidx.browser.customtabs.CustomTabsSessionToken
import expo.modules.kotlin.Promise
import java.time.Duration
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [35])
@LooperMode(LooperMode.Mode.PAUSED)
class CustomTabsHeadersTest {
  private val component = ComponentName("browser.test", "CustomTabsService")
  private val origin = Uri.parse("https://auth.example")
  private lateinit var helper: CustomTabsConnectionHelper
  private lateinit var browser: TestBrowser
  private lateinit var context: BindingContext
  private val opened = mutableListOf<CustomTabsSession>()

  @Before
  fun setUp() {
    val application = RuntimeEnvironment.getApplication()
    browser = Robolectric.buildService(TestBrowser::class.java).create().get()
    // Android does not send a disconnect callback when the client unbinds.
    shadowOf(application).setUnbindServiceCallsOnServiceDisconnected(false)
    shadowOf(application).setComponentNameAndServiceForBindService(component, browser.onBind(Intent()))
    context = BindingContext(application)
    helper = CustomTabsConnectionHelper(context)
  }

  @After
  fun tearDown() {
    helper.destroy()
  }

  @Test
  @Config(sdk = [28, 29, 35])
  fun waitsForMatchingVerificationAndLaunchesWithThatSession() {
    helper.warmUp(component.packageName)
    helper.mayInitWithUrl(component.packageName, origin)
    shadowOf(Looper.getMainLooper()).idle()
    val prewarmSession = browser.sessions.single()
    assertEquals(listOf(Context.BIND_AUTO_CREATE or Context.BIND_WAIVE_PRIORITY), context.browserBindFlags)
    assertTrue(context.temporaryBindings.isEmpty())

    context.delayTemporaryConnection = true
    val promise = open()
    assertEquals(listOf(prewarmSession), browser.sessions)
    assertNull(browser.requestedOrigin)
    assertFalse(promise.settled)
    val binding = context.temporaryBindings.single()
    assertEquals(CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION, binding.intent.action)
    assertEquals(component.packageName, binding.intent.`package`)
    val expectedFlags = if (Build.VERSION.SDK_INT >= 29) {
      Context.BIND_AUTO_CREATE or Context.BIND_NOT_PERCEPTIBLE
    } else {
      Context.BIND_AUTO_CREATE
    }
    assertEquals(expectedFlags, binding.flags)
    context.connect(binding)
    shadowOf(Looper.getMainLooper()).idle()
    val session = browser.sessions.last()
    assertNotEquals(prewarmSession, session)
    assertEquals(origin, browser.requestedOrigin)
    assertEquals(CustomTabsService.RELATION_USE_AS_ORIGIN, browser.requestedRelation)
    assertTrue(opened.isEmpty())
    assertFalse(promise.settled)
    assertThrows(BrowserHeadersException::class.java) { open() }

    session.callback!!.onRelationshipValidationResult(
      CustomTabsService.RELATION_USE_AS_ORIGIN,
      Uri.parse("https://other.example"),
      true,
      null
    )
    session.callback!!.onRelationshipValidationResult(
      CustomTabsService.RELATION_HANDLE_ALL_URLS,
      origin,
      true,
      null
    )
    shadowOf(Looper.getMainLooper()).idle()
    assertTrue(opened.isEmpty())
    assertFalse(promise.settled)

    browser.reply(session, origin, true)
    assertTrue(session.isAssociatedWith(opened.single()))
    assertEquals("opened", (promise.value as Bundle).getString("type"))
    assertNull(promise.error)
    assertEquals(listOf(binding.connection), context.released)
    helper.destroy()
    assertEquals(listOf(binding.connection), context.released)
  }

  @Test
  fun cancellationRejectsTheOldAttemptAndIgnoresItsLateResultDuringRetry() {
    val first = open()
    val oldSession = browser.sessions.last()
    helper.cancelPendingBrowserOpen()
    assertNotNull(first.error)
    assertEquals(1, context.released.size)
    val second = open()
    browser.reply(oldSession, origin, true)
    assertTrue(opened.isEmpty())
    assertFalse(second.settled)

    browser.reply(browser.sessions.last(), origin, true)
    assertEquals(1, opened.size)
    assertTrue(second.settled)
    assertNull(second.error)
    assertEquals(context.temporaryBindings.map { it.connection }, context.released)
    helper.destroy()
    assertEquals(2, context.released.size)
  }

  @Test
  fun failedAndUnsupportedVerificationRejectAndSilentVerificationTimesOut() {
    val denied = open()
    browser.reply(browser.sessions.last(), origin, false)
    assertNotNull(denied.error)
    assertEquals(1, context.released.size)

    browser.supportsVerification = false
    val unsupported = open()
    assertNotNull(unsupported.error)
    assertEquals(2, context.released.size)

    browser.supportsVerification = true
    browser.acceptsSession = false
    val noSession = open()
    assertNotNull(noSession.error)
    assertEquals(3, context.released.size)

    browser.acceptsSession = true
    context.delayTemporaryConnection = true
    val silent = open()
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(29))
    assertFalse(silent.settled)
    context.connect(context.temporaryBindings.last())
    shadowOf(Looper.getMainLooper()).idle()
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(1))
    assertNotNull(silent.error)
    browser.reply(browser.sessions.last(), origin, true)
    assertTrue(opened.isEmpty())
    assertEquals(4, context.released.size)
    assertEquals(context.temporaryBindings.map { it.connection }, context.released)
  }

  @Test
  fun disconnectAndDestroyRejectPendingRequestsWithoutLateLaunches() {
    val disconnected = open()
    val disconnectedSession = browser.sessions.last()
    helper.onServiceDisconnected(component)
    assertNotNull(disconnected.error)
    val destroyed = open()
    val destroyedSession = browser.sessions.last()
    helper.destroy()
    assertNotNull(destroyed.error)
    browser.reply(disconnectedSession, origin, true)
    browser.reply(destroyedSession, origin, true)
    assertTrue(opened.isEmpty())
    assertEquals(2, context.released.size)
    assertEquals(context.temporaryBindings.map { it.connection }, context.released)
  }

  @Test
  fun cancelAndTimeoutBeforeTemporaryConnectionIgnoreLateCallbacks() {
    context.delayTemporaryConnection = true
    val canceled = open()
    assertTrue(browser.sessions.isEmpty())
    val canceledBinding = context.temporaryBindings.single()
    helper.cancelPendingBrowserOpen()
    assertNotNull(canceled.error)
    assertEquals(listOf(canceledBinding.connection), context.released)

    val timedOut = open()
    val timedOutBinding = context.temporaryBindings.last()
    context.connect(canceledBinding)
    shadowOf(Looper.getMainLooper()).idle()
    assertTrue(browser.sessions.isEmpty())
    assertFalse(timedOut.settled)
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(30))
    assertNotNull(timedOut.error)
    context.connect(timedOutBinding)
    shadowOf(Looper.getMainLooper()).idle()
    assertTrue(browser.sessions.isEmpty())
    assertTrue(opened.isEmpty())
    assertEquals(listOf(canceledBinding.connection, timedOutBinding.connection), context.released)
    helper.destroy()
    assertEquals(2, context.released.size)
  }

  @Test
  fun failedTemporaryBindingReleasesRegistrationAndUsesExistingClient() {
    helper.warmUp(component.packageName)
    shadowOf(Looper.getMainLooper()).idle()
    context.acceptsTemporaryBinding = false
    val promise = open()
    assertEquals(1, context.released.size)
    assertEquals(listOf(context.temporaryBindings.single().connection), context.released)
    assertEquals(origin, browser.requestedOrigin)
    browser.reply(browser.sessions.single(), origin, true)
    assertEquals(1, opened.size)
    assertNull(promise.error)
    assertEquals("opened", (promise.value as Bundle).getString("type"))
    helper.destroy()
    assertEquals(1, context.released.size)
  }

  @Test
  fun failedBindingDoesNotLeaveAnUnbindableConnection() {
    shadowOf(RuntimeEnvironment.getApplication())
      .declareActionUnbindable(CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION)
    assertThrows(BrowserHeadersException::class.java) { open() }
    assertTrue(opened.isEmpty())
    helper.destroy()
  }

  private fun open(): TestPromise {
    val promise = TestPromise()
    helper.openWithHeaders(component.packageName, origin, promise) {
      opened.add(it)
      Bundle().apply { putString("type", "opened") }
    }
    shadowOf(Looper.getMainLooper()).idle()
    return promise
  }

  private data class Binding(val intent: Intent, val connection: ServiceConnection, val flags: Int)

  private inner class BindingContext(base: Context) : ContextWrapper(base) {
    val browserBindFlags = mutableListOf<Int>()
    val temporaryBindings = mutableListOf<Binding>()
    val released = mutableListOf<ServiceConnection>()
    var delayTemporaryConnection = false
    var acceptsTemporaryBinding = true

    override fun bindService(intent: Intent, connection: ServiceConnection, flags: Int): Boolean {
      if (connection is CustomTabsServiceConnection) {
        browserBindFlags.add(flags)
        return super.bindService(intent, connection, flags)
      }
      val binding = Binding(Intent(intent), connection, flags)
      temporaryBindings.add(binding)
      if (!acceptsTemporaryBinding) {
        return false
      }
      if (!delayTemporaryConnection) {
        Handler(mainLooper).post { connect(binding) }
      }
      return true
    }

    fun connect(binding: Binding) {
      // The temporary connection must not use its binder for Custom Tabs calls.
      binding.connection.onServiceConnected(component, Binder())
    }

    override fun unbindService(connection: ServiceConnection) {
      if (connection is CustomTabsServiceConnection) {
        super.unbindService(connection)
        return
      }
      released.add(connection)
    }
  }

  private class TestPromise : Promise {
    var settled = false
    var value: Any? = null
    var error: String? = null

    override fun resolve(value: Any?) {
      check(!settled)
      settled = true
      this.value = value
    }

    override fun reject(code: String?, message: String?, cause: Throwable?) {
      check(!settled)
      settled = true
      error = message
    }
  }

  class TestBrowser : CustomTabsService() {
    val sessions = mutableListOf<CustomTabsSessionToken>()
    var supportsVerification = true
    var acceptsSession = true
    var requestedOrigin: Uri? = null
    var requestedRelation: Int? = null

    fun reply(session: CustomTabsSessionToken, origin: Uri, result: Boolean) {
      session.callback!!.onRelationshipValidationResult(RELATION_USE_AS_ORIGIN, origin, result, null)
      shadowOf(Looper.getMainLooper()).idle()
    }

    override fun warmup(flags: Long) = true
    override fun newSession(sessionToken: CustomTabsSessionToken): Boolean {
      sessions.add(sessionToken)
      return acceptsSession
    }
    override fun validateRelationship(sessionToken: CustomTabsSessionToken, relation: Int, origin: Uri, extras: Bundle?): Boolean {
      requestedOrigin = origin
      requestedRelation = relation
      return supportsVerification
    }
    override fun mayLaunchUrl(sessionToken: CustomTabsSessionToken, url: Uri?, extras: Bundle?, otherLikelyBundles: MutableList<Bundle>?) = true
    override fun extraCommand(commandName: String, args: Bundle?): Bundle? = null
    override fun updateVisuals(sessionToken: CustomTabsSessionToken, bundle: Bundle?) = false
    override fun requestPostMessageChannel(sessionToken: CustomTabsSessionToken, postMessageOrigin: Uri) = false
    override fun postMessage(sessionToken: CustomTabsSessionToken, message: String, extras: Bundle?) = 0
    override fun receiveFile(sessionToken: CustomTabsSessionToken, uri: Uri, purpose: Int, extras: Bundle?) = false
  }
}
