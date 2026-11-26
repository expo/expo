package expo.modules.sharing

import android.app.Activity
import android.content.Intent
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowActivity
import java.io.File
import java.util.EnumSet

private const val APP_EXPO_CONTEXT_EXTENSIONS = "expo.modules.v2.AppExpoContextKt"

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class SharingModuleTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private val reactContext = BridgeReactContext(ApplicationProvider.getApplicationContext())
  private val module = SharingModule()
  private lateinit var activity: Activity
  private lateinit var fileToShare: File

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
    val scopedCacheDirectory = temporaryFolder.newFolder("scoped-cache")
    val appContext = mockk<AppContext> {
      every { cacheDirectory } returns scopedCacheDirectory
      every { this@mockk.filePermission } returns this@SharingModuleTest.filePermission
    }
    // `AppExpoContext` is internal to expo-modules-core, so the test stubs the extension instead.
    mockkStatic(APP_EXPO_CONTEXT_EXTENSIONS)
    every { module.legacyAppContext } returns appContext
    expoContext = ReactExpoContext(reactContext)
    expoContext.moduleRegistry.register(module)

    activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    reactContext.onHostResume(activity)

    // `SharingFileProvider` serves files from the cache directory of the app.
    fileToShare = File(reactContext.cacheDir, "note.txt").apply { writeText("note") }
  }

  @After
  fun tearDown() {
    unmockkStatic(APP_EXPO_CONTEXT_EXTENSIONS)
    unmockkObject(ExpoModulesV2)
  }

  private val shadowActivity: ShadowActivity
    get() = shadowOf(activity)

  private fun shareInBackground(url: String): Deferred<Unit> =
    CoroutineScope(Dispatchers.Default).async {
      module.shareAsync(url, SharingOptions(dialogTitle = "Share the note"))
    }

  private fun awaitStartedChooser(share: Deferred<Unit>): ShadowActivity.IntentForResult {
    val deadline = System.currentTimeMillis() + 5_000
    while (System.currentTimeMillis() < deadline) {
      shadowActivity.peekNextStartedActivityForResult()?.let { return it }
      if (share.isCompleted) {
        throw AssertionError("The share ended before the chooser started", share.getCompletionExceptionOrNull())
      }
      Thread.sleep(10)
    }
    error("The chooser was not started")
  }

  @Test
  fun `shareAsync rejects a URL that is not a local file`() {
    val error = assertThrows(SharingInvalidArgsException::class.java) {
      runBlocking { module.shareAsync("https://example.com/note.txt", SharingOptions()) }
    }

    assertEquals("ERR_SHARING_INVALID_ARGS", error.code)
    assertNull(shadowActivity.nextStartedActivityForResult)
  }

  @Test
  fun `shareAsync rejects a file that the permission service does not allow to read`() {
    // Expo Go denies paths outside the experience directories, even ones `SharingFileProvider`
    // could serve. Without the check, an experience shares files of Expo Go or of other experiences.
    every { filePermission.getPathPermissions(any(), any()) } returns
      EnumSet.noneOf(FilePermissionService.Permission::class.java)

    val error = assertThrows(SharingInvalidArgsException::class.java) {
      runBlocking { module.shareAsync(Uri.fromFile(fileToShare).toString(), SharingOptions()) }
    }

    assertEquals("ERR_SHARING_INVALID_ARGS", error.code)
    assertEquals("Not allowed to read file under given URL.", error.message)
    verify { filePermission.getPathPermissions(any(), fileToShare.path) }
    assertNull(shadowActivity.nextStartedActivityForResult)
  }

  // One test only reaches `FileProvider`: it caches its roots in a static field, which outlives the
  // data directory that Robolectric makes for each test.
  @Test
  fun `shareAsync resolves only after the chooser returns its result`() {
    // JavaScript awaits `shareAsync` to know that the user closed the share sheet.
    val share = shareInBackground(Uri.fromFile(fileToShare).toString())

    val chooser = awaitStartedChooser(share)
    assertEquals(Intent.ACTION_CHOOSER, chooser.intent.action)
    assertEquals("Share the note", chooser.intent.getCharSequenceExtra(Intent.EXTRA_TITLE))
    val sendIntent = requireNotNull(chooser.intent.getParcelableExtraCompat<Intent>(Intent.EXTRA_INTENT))
    assertEquals(Intent.ACTION_SEND, sendIntent.action)
    assertEquals("text/plain", sendIntent.type)
    val contentUri = requireNotNull(sendIntent.getParcelableExtraCompat<Uri>(Intent.EXTRA_STREAM))
    assertEquals("content", contentUri.scheme)
    assertEquals("${reactContext.packageName}.SharingFileProvider", contentUri.authority)

    // The chooser is open, so the call is still pending.
    Thread.sleep(100)
    assertFalse(share.isCompleted)

    // While the chooser is open, the module refuses another request.
    val error = assertThrows(SharingInProgressException::class.java) {
      runBlocking { module.shareAsync(Uri.fromFile(fileToShare).toString(), SharingOptions()) }
    }
    assertEquals("ERR_SHARING_IN_PROGRESS", error.code)

    // A result for another request belongs to someone else.
    reactContext.onActivityResult(activity, chooser.requestCode + 1, Activity.RESULT_OK, null)
    Thread.sleep(100)
    assertFalse(share.isCompleted)

    reactContext.onActivityResult(activity, chooser.requestCode, Activity.RESULT_CANCELED, null)
    runBlocking { withTimeout(5_000) { share.await() } }

    // Once the chooser returned, the module accepts a new request.
    shadowActivity.nextStartedActivityForResult
    val nextShare = shareInBackground(Uri.fromFile(fileToShare).toString())
    assertEquals(Intent.ACTION_CHOOSER, awaitStartedChooser(nextShare).intent.action)
    nextShare.cancel()
  }

  @Test
  fun `clearSharedPayloads removes the files shared into the app`() {
    // Share-into files are copied into the cache directory of the React context, so the module
    // clears that directory and not the one of the app context.
    val sharedFile = ShareIntoFileStore(reactContext.cacheDir).newDestination("photo.jpg")
      .apply { writeText("photo") }

    module.clearSharedPayloads()

    assertFalse(sharedFile.exists())
  }
}
