package expo.modules.application

import android.app.Application
import android.os.RemoteException
import android.provider.Settings
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.react.androidContext
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ApplicationModuleTest {
  private val application: Application = RuntimeEnvironment.getApplication()
  private val packageInfo = application.packageManager.getPackageInfo(application.packageName, 0)

  private val module = ApplicationModule()

  // An `ExpoContext` loads Expo Modules v2's native library, which a JVM test does not have, so
  // the module reads the application through a mocked `androidContext` instead.
  @Before
  fun mockAndroidContext() {
    mockkStatic(REACT_CONTEXT_EXTENSIONS)
    every { module.androidContext } returns application
  }

  @After
  fun unmockAndroidContext() {
    unmockkStatic(REACT_CONTEXT_EXTENSIONS)
    unmockkStatic(InstallReferrerClient::class)
  }

  @Test
  fun `applicationId is the package name`() {
    assertEquals(application.packageName, module.applicationId)
  }

  @Test
  fun `applicationName is the application label`() {
    assertEquals(
      application.applicationInfo.loadLabel(application.packageManager).toString(),
      module.applicationName
    )
  }

  @Test
  fun `nativeApplicationVersion and nativeBuildVersion come from the package info`() {
    assertEquals(packageInfo.versionName, module.nativeApplicationVersion)
    // `longVersionCode` needs API 28; with no major version both codes are the same number.
    @Suppress("DEPRECATION")
    assertEquals(packageInfo.versionCode.toString(), module.nativeBuildVersion)
  }

  @Test
  fun `androidId is the secure Android ID`() {
    assertEquals(
      Settings.Secure.getString(application.contentResolver, Settings.Secure.ANDROID_ID),
      module.androidId
    )
  }

  @Test
  fun `getInstallationTimeAsync resolves to the first install time`() = runBlocking {
    assertEquals(packageInfo.firstInstallTime.toDouble(), module.getInstallationTimeAsync(), 0.0)
  }

  @Test
  fun `getLastUpdateTimeAsync resolves to the last update time`() = runBlocking {
    assertEquals(packageInfo.lastUpdateTime.toDouble(), module.getLastUpdateTimeAsync(), 0.0)
  }

  @Test
  fun `getInstallReferrerAsync rejects when the Play Store does not support the referrer API`() {
    mockInstallReferrerClient { listener ->
      listener.onInstallReferrerSetupFinished(InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED)
    }

    assertInstallReferrerRejects<ApplicationInstallReferrerUnavailableException>("ERR_APPLICATION_INSTALL_REFERRER_UNAVAILABLE")
  }

  @Test
  fun `getInstallReferrerAsync rejects when the referrer service is unavailable`() {
    mockInstallReferrerClient { listener ->
      listener.onInstallReferrerSetupFinished(InstallReferrerClient.InstallReferrerResponse.SERVICE_UNAVAILABLE)
    }

    assertInstallReferrerRejects<ApplicationInstallReferrerException>("ERR_APPLICATION_INSTALL_REFERRER")
  }

  @Test
  fun `getInstallReferrerAsync rejects when reading the referrer throws a RemoteException`() {
    val client = mockInstallReferrerClient { listener ->
      listener.onInstallReferrerSetupFinished(InstallReferrerClient.InstallReferrerResponse.OK)
    }
    every { client.installReferrer } throws RemoteException()

    assertInstallReferrerRejects<ApplicationInstallReferrerRemoteException>("ERR_APPLICATION_INSTALL_REFERRER_REMOTE_EXCEPTION")
  }

  @Test
  fun `getInstallReferrerAsync rejects when the referrer service disconnects`() {
    mockInstallReferrerClient { listener ->
      listener.onInstallReferrerServiceDisconnected()
    }

    assertInstallReferrerRejects<ApplicationInstallReferrerServiceDisconnectedException>("ERR_APPLICATION_INSTALL_REFERRER_SERVICE_DISCONNECTED")
  }

  /** Makes the module build a mocked client, which calls `onStartConnection` when it connects. */
  private fun mockInstallReferrerClient(onStartConnection: (InstallReferrerStateListener) -> Unit): InstallReferrerClient {
    val client = mockk<InstallReferrerClient>(relaxed = true)
    every { client.startConnection(any()) } answers { onStartConnection(firstArg()) }

    val builder = mockk<InstallReferrerClient.Builder>()
    every { builder.build() } returns client

    mockkStatic(InstallReferrerClient::class)
    every { InstallReferrerClient.newBuilder(any()) } returns builder
    return client
  }

  // The error codes are part of the documented API, so the test checks them by their literal value.
  private inline fun <reified T : CodedException> assertInstallReferrerRejects(expectedCode: String) {
    val exception = assertThrows(T::class.java) {
      runBlocking { module.getInstallReferrerAsync() }
    }
    assertEquals(expectedCode, exception.code)
  }
}

/** The file class that holds `androidContext`, which mockk mocks as a static. */
private const val REACT_CONTEXT_EXTENSIONS = "io.github.expo.modules.v2.react.ReactContextExtensionsKt"
