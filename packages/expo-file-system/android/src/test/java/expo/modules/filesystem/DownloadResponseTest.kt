package expo.modules.filesystem

import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.kotlin.services.Service
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import java.lang.ref.WeakReference
import java.net.URI
import java.util.EnumSet

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class DownloadResponseTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  // The runtime and React context are weakly held by SharedObject/AppContext.
  private val reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
  private val appContext = AppContext(
    object : ModulesProvider {
      override fun getModulesMap(): Map<Class<out Module>, String?> = emptyMap()
      override fun getServices(): List<Class<out Service>> = emptyList()
    },
    expo.modules.core.ModuleRegistry(emptyList(), emptyList()),
    WeakReference(reactContext)
  ).also {
    it.services.register(
      FilePermissionService::class.java,
      object : FilePermissionService() {
        override fun getPathPermissions(context: android.content.Context, path: String): EnumSet<Permission> =
          EnumSet.allOf(Permission::class.java)
      }
    )
  }

  @Test
  fun exposesSuccessfulAndResumedResponses() = runBlocking {
    withServer { url ->
      val task = FileSystemDownloadTask()
      val destination = destination()
      assertEquals(null, task.getResponse()["status"])
      assertEquals(emptyMap<String, String>(), task.getResponse()["headers"])
      task.start(url.resolve("/success"), destination, null)
      assertEquals(200, task.getResponse()["status"])
      assertEquals("first", headers(task)["x-response"])
      assertEquals("abc", destination.javaFile.readText())

      task.resume(url.resolve("/partial"), destination, "3", null)
      assertEquals(206, task.getResponse()["status"])
      assertEquals("bytes=3-", headers(task)["x-range"])
      assertEquals("abcdef", destination.javaFile.readText())
    }
  }

  @Test
  fun retainsHttpFailureMetadataAndClearsItBeforeAnotherAttempt() = runBlocking {
    withServer { url ->
      val task = FileSystemDownloadTask()
      val destination = destination()
      assertThrows(UnableToDownloadException::class.java) {
        runBlocking { task.start(url.resolve("/failure"), destination, null) }
      }
      assertEquals(429, task.getResponse()["status"])
      assertEquals("60", headers(task)["retry-after"])
      assertThrows(InvalidResumeDataException::class.java) {
        runBlocking { task.resume(url, destination, "invalid", null) }
      }
      assertEquals(null, task.getResponse()["status"])
      assertEquals(emptyMap<String, String>(), task.getResponse()["headers"])
    }
  }

  private fun destination() = FileSystemFile(Uri.fromFile(temporaryFolder.newFile())).apply {
    runtimeContextHolder = WeakReference(this@DownloadResponseTest.appContext.runtime)
  }

  private fun headers(task: FileSystemDownloadTask): Map<String, String> {
    val headers = task.getResponse()["headers"] as Map<*, *>
    return headers.entries.associate { it.key.toString().lowercase() to it.value.toString() }
  }

  private suspend fun withServer(block: suspend (URI) -> Unit) {
    val server = MockWebServer()
    server.dispatcher = object : Dispatcher() {
      override fun dispatch(request: RecordedRequest): MockResponse {
        val status = when (request.path) {
          "/failure" -> 429
          "/partial" -> 206
          else -> 200
        }
        return MockResponse()
          .setResponseCode(status)
          .addHeader("X-Response", "first")
          .addHeader("X-Response", "second")
          .addHeader("Retry-After", "60")
          .setBody(
            if (status == 206) {
              "def"
            } else {
              "abc"
            }
          )
          .apply {
            request.getHeader("Range")?.let { addHeader("X-Range", it) }
          }
      }
    }
    server.start()
    try {
      block(server.url("/").toUri())
    } finally {
      server.shutdown()
    }
  }
}
