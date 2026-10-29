package expo.modules.filesystem

import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.kotlin.services.Service
import java.io.File
import java.lang.ref.WeakReference
import java.util.EnumSet
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

// Every FileProvider this app ships serves the whole files and cache trees, and an in-process caller
// reaches them regardless of android:exported. In Expo Go those trees hold every experience's
// sandbox, so a content:// URI that resolves back into them has to clear the same path check as the
// equivalent file:// path. URIs that do not resolve into them are left alone.
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class FileSystemContentUriPermissionTest {
  private val application get() = RuntimeEnvironment.getApplication()
  private val ownAuthority get() = "${application.packageName}.FileSystemFileProvider"

  // FileProvider caches one PathStrategy per authority in a static map, and it resolves the roots
  // against the data directory it first saw. Robolectric hands every test method a fresh data
  // directory, so without this the cache from the previous method makes getUriForFile fail here.
  // Production has a single stable data directory and never hits this.
  @Before
  fun resetFileProviderCache() {
    val cache = FileProvider::class.java.getDeclaredField("sCache").apply { isAccessible = true }
    (cache.get(null) as MutableMap<*, *>).clear()
  }

  @Test
  fun ownProviderUriIsCheckedAgainstTheFileItResolvesTo() {
    writeInternalFile("ExperienceData/other-scope/secret.txt")
    val file = FileSystemFile(Uri.parse("content://$ownAuthority/expo_files/ExperienceData/other-scope/secret.txt"))
      .withAppContext(permissionServiceReturning(EnumSet.noneOf(FilePermissionService.Permission::class.java)))

    assertFalse(file.checkPermission(FilePermissionService.Permission.READ))
  }

  @Test
  fun ownProviderUriIsAllowedWhenTheResolvedPathIsPermitted() {
    writeInternalFile("ExperienceData/own-scope/mine.txt")
    val file = FileSystemFile(Uri.parse("content://$ownAuthority/expo_files/ExperienceData/own-scope/mine.txt"))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.READ)))

    assertTrue(file.checkPermission(FilePermissionService.Permission.READ))
  }

  // A forged URI naming a file that does not exist yet must still be checked, otherwise the same
  // trick plants a new file in another sandbox instead of overwriting one.
  @Test
  fun ownProviderUriIsCheckedEvenWhenTheFileDoesNotExistYet() {
    val file = FileSystemFile(Uri.parse("content://$ownAuthority/expo_files/ExperienceData/other-scope/not-created.txt"))
      .withAppContext(permissionServiceReturning(EnumSet.noneOf(FilePermissionService.Permission::class.java)))

    assertFalse(file.checkPermission(FilePermissionService.Permission.WRITE))
  }

  // ContentResolver drops a "<userId>@" prefix before resolving the provider, so a URI carrying one
  // is still served by our own provider and has to be checked the same way.
  @Test
  fun ownProviderUriIsCheckedWhenTheAuthorityCarriesAUserIdPrefix() {
    writeInternalFile("ExperienceData/other-scope/secret.txt")
    val file = FileSystemFile(Uri.parse("content://0@$ownAuthority/expo_files/ExperienceData/other-scope/secret.txt"))
      .withAppContext(permissionServiceReturning(EnumSet.noneOf(FilePermissionService.Permission::class.java)))

    assertFalse(file.checkPermission(FilePermissionService.Permission.READ))
  }

  // Anything this app does not serve itself keeps today's behaviour: SAF, MediaStore, share intents.
  @Test
  fun foreignProviderUriKeepsTodaysBehaviour() {
    val file = FileSystemFile(Uri.parse("content://com.android.externalstorage.documents/tree/primary%3ADownload"))
      .withAppContext(permissionServiceReturning(EnumSet.noneOf(FilePermissionService.Permission::class.java)))

    assertTrue(file.checkPermission(FilePermissionService.Permission.READ))
  }

  @Test
  fun assetUriKeepsTodaysBehaviour() {
    val file = FileSystemFile(Uri.parse("asset:///some-bundled-asset.txt"))
      .withAppContext(permissionServiceReturning(EnumSet.noneOf(FilePermissionService.Permission::class.java)))

    assertTrue(file.checkPermission(FilePermissionService.Permission.READ))
  }

  private fun writeInternalFile(relativePath: String): File =
    File(application.filesDir, relativePath).apply {
      parentFile?.mkdirs()
      writeText("content")
    }

  private fun permissionServiceReturning(permissions: EnumSet<FilePermissionService.Permission>) =
    object : FilePermissionService() {
      override fun getPathPermissions(
        context: android.content.Context,
        path: String
      ): EnumSet<Permission> = permissions
    }

  // See the matching note in FileSystemFileTest: the context graph is held through WeakReferences,
  // so it has to be retained for the lifetime of the test.
  private val retainedContexts = mutableListOf<Any>()

  private fun createAppContext(permissionService: FilePermissionService): AppContext {
    val reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
    retainedContexts.add(reactContext)
    return AppContext(
      object : ModulesProvider {
        override fun getModulesMap(): Map<Class<out Module>, String?> = emptyMap()
        override fun getServices(): List<Class<out Service>> = emptyList()
      },
      expo.modules.core.ModuleRegistry(emptyList(), emptyList()),
      WeakReference(reactContext)
    ).also {
      it.services.register(FilePermissionService::class.java, permissionService)
      retainedContexts.add(it)
    }
  }

  private fun <T : FileSystemPath> T.withAppContext(permissionService: FilePermissionService): T =
    apply {
      runtimeContextHolder = WeakReference(createAppContext(permissionService).runtime)
    }
}
