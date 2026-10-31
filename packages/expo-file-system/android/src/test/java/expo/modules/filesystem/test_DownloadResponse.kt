package expo.modules.filesystem

import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.BridgeReactContext
import com.sun.net.httpserver.HttpServer
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.kotlin.services.Service
import kotlinx.coroutines.runBlocking
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
import java.net.InetSocketAddress
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
    runtimeContextHolder = WeakReference(appContext.runtime)
  }

  private fun headers(task: FileSystemDownloadTask): Map<String, String> {
    val headers = task.getResponse()["headers"] as Map<*, *>
    return headers.entries.associate { it.key.toString().lowercase() to it.value.toString() }
  }

  private suspend fun withServer(block: suspend (URI) -> Unit) {
    val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    server.createContext("/") { exchange ->
      val status = when (exchange.requestURI.path) {
        "/failure" -> 429
        "/partial" -> 206
        else -> 200
      }
      exchange.responseHeaders.add("X-Response", "first")
      exchange.responseHeaders.add("Retry-After", "60")
      exchange.requestHeaders.getFirst("Range")?.let { exchange.responseHeaders.add("X-Range", it) }
      val body = (if (status == 206) "def" else "abc").toByteArray()
      exchange.sendResponseHeaders(status, body.size.toLong())
      exchange.responseBody.use { it.write(body) }
    }
    server.start()
    try {
      block(URI("http://127.0.0.1:${server.address.port}/"))
    } finally {
      server.stop(0)
    }
  }
}
