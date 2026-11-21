package expo.modules.asset

import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.v2.legacyAppContext
import io.github.expo.modules.v2.react.ReactExpoContext
import io.github.expo.modules.v2.core.ExpoModulesV2
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.unmockkObject
import io.mockk.unmockkStatic
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.net.URI
import java.util.EnumSet

private const val APP_EXPO_CONTEXT_EXTENSIONS = "expo.modules.v2.AppExpoContextKt"

// The remote URL is never reachable, so a test passes only when the module skips the download.
private val UNREACHABLE_ASSET_URL = URI.create("http://localhost:1/assets/icon.png")

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class AssetModuleTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private val reactContext = BridgeReactContext(ApplicationProvider.getApplicationContext())
  private val module = AssetModule()
  private lateinit var cacheDirectory: File

  // A module holds its context weakly. In an app, the host keeps it alive.
  private lateinit var expoContext: ReactExpoContext
  private val filePermission = mockk<FilePermissionService> {
    every { getPathPermissions(any(), any()) } returns
      EnumSet.of(FilePermissionService.Permission.READ, FilePermissionService.Permission.WRITE)
  }

  @Before
  fun setUp() {
    // A JVM test has no Expo Modules v2 native library, which a module registry loads when it is
    // created. Nothing in these tests calls into it.
    mockkObject(ExpoModulesV2)
    every { ExpoModulesV2.load() } returns Unit

    // In Expo Go, the app context gives the cache directory and permission service of one experience.
    cacheDirectory = temporaryFolder.newFolder("scoped-cache")
    val appContext = mockk<AppContext> {
      every { this@mockk.cacheDirectory } returns this@AssetModuleTest.cacheDirectory
      every { this@mockk.filePermission } returns this@AssetModuleTest.filePermission
    }
    // `AppExpoContext` is internal to expo-modules-core, so the test stubs the extension instead.
    mockkStatic(APP_EXPO_CONTEXT_EXTENSIONS)
    every { module.legacyAppContext } returns appContext
    expoContext = ReactExpoContext(reactContext)
    expoContext.moduleRegistry.register(module)
  }

  @After
  fun tearDown() {
    unmockkStatic(APP_EXPO_CONTEXT_EXTENSIONS)
    unmockkObject(ExpoModulesV2)
  }

  private fun cachedAsset(directory: File, content: String): String {
    val file = File(directory, "ExponentAsset-cached.png").apply { writeText(content) }
    val md5Hash = requireNotNull(getMD5HashOfFileContent(file))
    file.renameTo(File(directory, "ExponentAsset-$md5Hash.png"))
    return md5Hash
  }

  @Test
  fun `downloadAsync returns a local file URI unchanged`() = runBlocking {
    val uri = "file:///data/user/0/com.example/files/icon.png"

    assertEquals(uri, module.downloadAsync(URI.create(uri), null, "png"))
  }

  @Test
  fun `downloadAsync reuses a cached file whose content matches the hash`() = runBlocking {
    val md5Hash = cachedAsset(cacheDirectory, "icon")

    val result = module.downloadAsync(UNREACHABLE_ASSET_URL, md5Hash, "png")

    assertEquals(Uri.fromFile(File(cacheDirectory, "ExponentAsset-$md5Hash.png")).toString(), result)
  }

  @Test(expected = UnableToDownloadAssetException::class)
  fun `downloadAsync downloads again when the cached file does not match the hash`(): Unit = runBlocking {
    File(cacheDirectory, "ExponentAsset-stale.png").writeText("old icon")

    module.downloadAsync(UNREACHABLE_ASSET_URL, "stale", "png")
  }

  @Test(expected = UnableToDownloadAssetException::class)
  fun `downloadAsync ignores files in the React context cache directory`(): Unit = runBlocking {
    // In Expo Go, that directory is shared by Expo Go and all experiences.
    val md5Hash = cachedAsset(reactContext.cacheDir, "icon")

    module.downloadAsync(UNREACHABLE_ASSET_URL, md5Hash, "png")
  }

  @Test
  fun `downloadAsync refuses to write where the permission service denies it`() {
    // Expo Go denies paths outside the experience directories. Without the check, a crafted type
    // writes into another directory of Expo Go: here, a sibling of the cache directory.
    every { filePermission.getPathPermissions(any(), any()) } returns
      EnumSet.noneOf(FilePermissionService.Permission::class.java)
    val type = "../../../files/x"

    assertThrows(UnableToDownloadAssetException::class.java) {
      runBlocking { module.downloadAsync(UNREACHABLE_ASSET_URL, "crafted", type) }
    }

    val target = File("$cacheDirectory/ExponentAsset-crafted.$type")
    verify { filePermission.getPathPermissions(reactContext, requireNotNull(target.parent)) }
    assertFalse(File(temporaryFolder.root, "files").exists())
    assertEquals(emptyList<String>(), cacheDirectory.list()!!.toList())
  }
}
