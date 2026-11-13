package expo.modules.asset

import android.content.Context
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import io.github.expo.modules.v2.react.androidContext
import io.mockk.every
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.net.URI

/** The file class that holds `androidContext`, which mockk mocks as a static. */
private const val REACT_CONTEXT_EXTENSIONS = "io.github.expo.modules.v2.react.ReactContextExtensionsKt"

// The remote URL is never reachable, so a test passes only when the module skips the download.
private val UNREACHABLE_ASSET_URL = URI.create("http://localhost:1/assets/icon.png")

@RunWith(RobolectricTestRunner::class)
class AssetModuleTest {
  private val module = AssetModule()
  private val context = ApplicationProvider.getApplicationContext<Context>()

  @Before
  fun setUp() {
    // A JVM test has no Expo Modules v2 native library, so the module reads the application
    // through a mocked `androidContext`.
    mockkStatic(REACT_CONTEXT_EXTENSIONS)
    every { module.androidContext } returns context
  }

  @After
  fun tearDown() {
    unmockkStatic(REACT_CONTEXT_EXTENSIONS)
  }

  @Test
  fun `downloadAsync returns a local file URI unchanged`() = runBlocking {
    val uri = "file:///data/user/0/com.example/files/icon.png"

    assertEquals(uri, module.downloadAsync(URI.create(uri), null, "png"))
  }

  @Test
  fun `downloadAsync reuses a cached file whose content matches the hash`() = runBlocking {
    val cachedFile = File(context.cacheDir, "ExponentAsset-cached.png").apply { writeText("icon") }
    val md5Hash = requireNotNull(getMD5HashOfFileContent(cachedFile))
    cachedFile.renameTo(File(context.cacheDir, "ExponentAsset-$md5Hash.png"))

    val result = module.downloadAsync(UNREACHABLE_ASSET_URL, md5Hash, "png")

    assertEquals(Uri.fromFile(File(context.cacheDir, "ExponentAsset-$md5Hash.png")).toString(), result)
  }

  @Test(expected = UnableToDownloadAssetException::class)
  fun `downloadAsync downloads again when the cached file does not match the hash`(): Unit = runBlocking {
    File(context.cacheDir, "ExponentAsset-stale.png").writeText("old icon")

    module.downloadAsync(UNREACHABLE_ASSET_URL, "stale", "png")
  }
}
