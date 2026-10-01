package host.exp.exponent

import android.content.Context
import android.net.Uri
import expo.modules.manifests.core.Manifest
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.Kernel
import host.exp.exponent.services.FakeSessionCipher
import host.exp.exponent.services.SessionStore
import io.mockk.mockk
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = TestApplication::class)
class ExpoUpdatesAppLoaderRequestHeadersTest {
  private val context: Context = RuntimeEnvironment.getApplication()
  private val manifestUrl = Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000/group/abc")

  private val sessionStore = SessionStore(
    context.getSharedPreferences("request-headers-test", Context.MODE_PRIVATE),
    FakeSessionCipher()
  )

  @Before
  fun registerKernel() {
    NativeModuleDepsProvider.instance.add(Kernel::class.java, mockk<Kernel>(relaxed = true))
    SessionStore.setInstanceForTesting(sessionStore)
  }

  @After
  fun resetSessionStore() {
    SessionStore.setInstanceForTesting(null)
  }

  private fun loader() =
    ExpoUpdatesAppLoader("exp://u.expo.dev/00000000-0000-0000-0000-000000000000/group/abc", NoopCallback)

  @Test
  fun sendsTheSignedInSessionSecret() {
    sessionStore.add("session-secret-123")

    val headers = loader().requestHeaders(manifestUrl, versionName = "58.0.0")

    assertEquals("session-secret-123", headers["Expo-Session"])
  }

  @Test
  fun sendsTheActiveSessionSecretWhenSeveralAreStored() {
    val first = sessionStore.add("first-secret")
    sessionStore.add("second-secret")
    sessionStore.activate(first.id)

    val headers = loader().requestHeaders(manifestUrl, versionName = "58.0.0")

    assertEquals("first-secret", headers["Expo-Session"])
  }

  @Test
  fun omitsTheSessionHeaderWhenSignedOut() {
    val headers = loader().requestHeaders(manifestUrl, versionName = "58.0.0")

    assertFalse(headers.containsKey("Expo-Session"))
  }

  private object NoopCallback : ExpoUpdatesAppLoader.AppLoaderCallback {
    override fun onOptimisticManifest(optimisticManifest: Manifest) = Unit
    override fun onManifestCompleted(manifest: Manifest) = Unit
    override fun onBundleCompleted(localBundlePath: String) = Unit
    override fun emitEvent(params: JSONObject) = Unit
    override fun updateStatus(status: ExpoUpdatesAppLoader.AppLoaderStatus?) = Unit
    override fun onError(e: Exception) = Unit
  }
}
