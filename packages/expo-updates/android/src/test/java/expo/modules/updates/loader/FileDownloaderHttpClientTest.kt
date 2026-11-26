package expo.modules.updates.loader

import android.net.Uri
import com.facebook.react.modules.network.OkHttpClientProvider
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import expo.modules.updates.logging.UpdatesLogger
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkObject
import kotlinx.coroutines.test.runTest
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger

@RunWith(RobolectricTestRunner::class)
class FileDownloaderHttpClientTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private lateinit var server: MockWebServer
  private lateinit var logger: UpdatesLogger
  private lateinit var database: UpdatesDatabase
  private val sharedClientCalls = AtomicInteger()

  @Before
  fun setUp() {
    server = MockWebServer()
    server.start()
    logger = UpdatesLogger(temporaryFolder.newFolder("logs"))
    database = mockk(relaxed = true)
    val rejectingSharedClient = OkHttpClient.Builder()
      .addInterceptor(
        Interceptor {
          sharedClientCalls.incrementAndGet()
          throw IOException("Rejected by the shared client")
        }
      )
      .build()
    mockkObject(OkHttpClientProvider)
    every { OkHttpClientProvider.getOkHttpClient() } returns rejectingSharedClient
  }

  @After
  fun tearDown() {
    unmockkObject(OkHttpClientProvider)
    server.shutdown()
  }

  @Test
  fun `downloads bypass the shared React Native client when useReactNativeHttpClient is false`() = runTest {
    server.enqueue(MockResponse().setResponseCode(204).setHeader("expo-protocol-version", "1"))
    val downloader = createFileDownloader(
      extraConfiguration = mapOf(UpdatesConfiguration.UPDATES_CONFIGURATION_USE_REACT_NATIVE_HTTP_CLIENT_KEY to false)
    )

    val response = downloader.downloadRemoteUpdate(null)

    assertNull(response.manifestUpdateResponsePart)
    assertEquals(0, sharedClientCalls.get())
    assertEquals(1, server.requestCount)
  }

  private fun createFileDownloader(extraConfiguration: Map<String, Any>): FileDownloader {
    val configuration = UpdatesConfiguration(
      null,
      mapOf<String, Any>(
        "updateUrl" to Uri.parse(server.url("/manifest").toString()),
        "runtimeVersion" to "1.0"
      ) + extraConfiguration
    )
    return FileDownloader(temporaryFolder.newFolder(), "test-eas-client-id", configuration, logger, database)
  }
}
