package expo.modules.webbrowser

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Looper
import androidx.browser.customtabs.CustomTabsService
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
  private val opened = mutableListOf<CustomTabsSession>()

  @Before
  fun setUp() {
    val application = RuntimeEnvironment.getApplication()
    browser = Robolectric.buildService(TestBrowser::class.java).create().get()
    // Android does not send a disconnect callback when the client unbinds.
    shadowOf(application).setUnbindServiceCallsOnServiceDisconnected(false)
    shadowOf(application).setComponentNameAndServiceForBindService(component, browser.onBind(Intent()))
    helper = CustomTabsConnectionHelper(application)
  }

  @After
  fun tearDown() {
    helper.destroy()
  }

  @Test
  fun waitsForMatchingVerificationAndLaunchesWithThatSession() {
    helper.mayInitWithUrl(component.packageName, origin)
    shadowOf(Looper.getMainLooper()).idle()
    val prewarmSession = browser.sessions.single()
    val promise = open()
    val session = browser.sessions.last()
    assertNotEquals(prewarmSession, session)
    assertEquals(origin, browser.requestedOrigin)
    assertEquals(CustomTabsService.RELATION_USE_AS_ORIGIN, browser.requestedRelation)
    assertTrue(opened.isEmpty())
    assertFalse(promise.settled)
    assertThrows(BrowserHeadersException::class.java) { open() }

    session.callback!!.onRelationshipValidationResult(
      CustomTabsService.RELATION_USE_AS_ORIGIN, Uri.parse("https://other.example"), true, null
    )
    session.callback!!.onRelationshipValidationResult(
      CustomTabsService.RELATION_HANDLE_ALL_URLS, origin, true, null
    )
    shadowOf(Looper.getMainLooper()).idle()
    assertTrue(opened.isEmpty())
    assertFalse(promise.settled)

    browser.reply(session, origin, true)
    assertTrue(session.isAssociatedWith(opened.single()))
    assertEquals("opened", (promise.value as Bundle).getString("type"))
    assertNull(promise.error)
  }

  @Test
  fun cancellationRejectsTheOldAttemptAndIgnoresItsLateResultDuringRetry() {
    val first = open()
    val oldSession = browser.sessions.last()
    helper.cancelPendingBrowserOpen()
    assertNotNull(first.error)
    val second = open()
    browser.reply(oldSession, origin, true)
    assertTrue(opened.isEmpty())
    assertFalse(second.settled)

    browser.reply(browser.sessions.last(), origin, true)
    assertEquals(1, opened.size)
    assertTrue(second.settled)
    assertNull(second.error)
  }

  @Test
  fun failedAndUnsupportedVerificationRejectAndSilentVerificationTimesOut() {
    val denied = open()
    browser.reply(browser.sessions.last(), origin, false)
    assertNotNull(denied.error)

    browser.supportsVerification = false
    val unsupported = open()
    assertNotNull(unsupported.error)

    browser.supportsVerification = true
    browser.acceptsSession = false
    val noSession = open()
    assertNotNull(noSession.error)

    browser.acceptsSession = true
    val silent = open()
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMinutes(1))
    assertNotNull(silent.error)
    browser.reply(browser.sessions.last(), origin, true)
    assertTrue(opened.isEmpty())
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
