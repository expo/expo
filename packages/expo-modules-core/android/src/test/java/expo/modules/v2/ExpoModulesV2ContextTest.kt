package expo.modules.v2

import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.services.FilePermissionService
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.core.ExpoModulesV2
import io.github.expo.modules.v2.react.ReactExpoContext
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.lang.ref.WeakReference

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class ExpoModulesV2ContextTest {
  private val reactContext = BridgeReactContext(ApplicationProvider.getApplicationContext())
  private val module = object : Module() {}

  // A module holds its context weakly. In an app, the host keeps it alive.
  private lateinit var context: ReactExpoContext

  @Before
  fun setUp() {
    // A JVM test has no Expo Modules v2 native library, which a module registry loads when it is
    // created. Nothing in these tests calls into it.
    mockkObject(ExpoModulesV2)
    every { ExpoModulesV2.load() } returns Unit
  }

  @After
  fun tearDown() {
    unmockkObject(ExpoModulesV2)
  }

  private fun bind(context: ReactExpoContext) {
    this.context = context
    context.moduleRegistry.register("Test", module) {}
  }

  @Test
  fun `extensions return the app context values`() {
    // In Expo Go these are the directories and the permission service of one experience.
    val scopedPermission = mockk<FilePermissionService>()
    val appContext = mockk<AppContext> {
      every { cacheDirectory } returns File("/scoped/cache")
      every { persistentFilesDirectory } returns File("/scoped/files")
      every { filePermission } returns scopedPermission
    }
    bind(ExpoModulesV2Context(reactContext, WeakReference(appContext)))

    assertEquals(File("/scoped/cache"), module.cacheDirectory)
    assertEquals(File("/scoped/files"), module.filesDirectory)
    assertSame(scopedPermission, module.filePermission)
  }

  @Test
  fun `extensions read the services on every access`() {
    // Expo Go registers its scoped services after the app context is created, so a value read
    // once, early, could be the default one.
    var cacheDirectory = File("/default/cache")
    val appContext = mockk<AppContext> {
      every { this@mockk.cacheDirectory } answers { cacheDirectory }
    }
    bind(ExpoModulesV2Context(reactContext, WeakReference(appContext)))

    assertEquals(File("/default/cache"), module.cacheDirectory)
    cacheDirectory = File("/scoped/cache")
    assertEquals(File("/scoped/cache"), module.cacheDirectory)
  }

  @Test
  fun `extensions fall back outside an ExpoModulesV2Context`() {
    bind(ReactExpoContext(reactContext))

    assertFallbackValues()
  }

  @Test
  fun `values throw when the app context is gone`() {
    bind(ExpoModulesV2Context(reactContext, WeakReference(null)))

    // In Expo Go, the React context directories and the default permission service belong to Expo
    // Go itself, not to the experience. A fallback to them would leave the experience scope.
    assertThrows(Exceptions.AppContextLost::class.java) { module.cacheDirectory }
    assertThrows(Exceptions.AppContextLost::class.java) { module.filesDirectory }
    assertThrows(Exceptions.AppContextLost::class.java) { module.filePermission }
  }

  @Test
  fun `values throw when the context is closed`() {
    val appContext = mockk<AppContext> {
      every { cacheDirectory } returns File("/scoped/cache")
      every { persistentFilesDirectory } returns File("/scoped/files")
      every { filePermission } returns mockk()
    }
    bind(ExpoModulesV2Context(reactContext, WeakReference(appContext)))

    context.close()

    // A coded exception, so a module function rejects with a known code.
    assertThrows(Exceptions.AppContextLost::class.java) { module.cacheDirectory }
    assertThrows(Exceptions.AppContextLost::class.java) { module.filesDirectory }
    assertThrows(Exceptions.AppContextLost::class.java) { module.filePermission }
  }

  private fun assertFallbackValues() {
    assertEquals(reactContext.cacheDir, module.cacheDirectory)
    assertEquals(reactContext.filesDir, module.filesDirectory)
    val permissions = module.filePermission.getPathPermissions(reactContext, reactContext.cacheDir.path)
    assertTrue(permissions.contains(FilePermissionService.Permission.WRITE))
  }
}
