package expo.modules.filesystem

import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.kotlin.services.Service
import java.lang.ref.WeakReference
import java.net.URI
import java.util.EnumSet
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertThrows
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

// These sinks reach the filesystem through the raw UnifiedFileInterface, which opens files under
// the process UID. In Expo Go that UID is shared by every experience, so the FilePermissionService
// is the only thing keeping one experience out of another's files. These tests pin the checks that
// keep the network sinks behind that service.
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class FileSystemPermissionSinkTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  @Test
  fun uploadRequiresReadPermissionBeforeOpeningSourceFile() {
    val source = temporaryFolder.newFile("upload-source.txt").apply {
      writeText("secret")
    }
    val file = FileSystemFile(Uri.fromFile(source))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.WRITE)))

    assertThrows(InvalidPermissionException::class.java) {
      runBlocking {
        FileSystemUploadTask().start("https://127.0.0.1:1/collect", file, UploadTaskOptions())
      }
    }
  }

  // The module bindings already validate WRITE before calling start()/resume(). This pins the same
  // check at the sink, so a future caller that skips the binding cannot resolve a destination it is
  // not allowed to write to.
  @Test
  fun downloadRequiresWritePermissionOnDestinationBeforeResolvingIt() {
    val destination = temporaryFolder.newFile("download-target.txt")
    val file = FileSystemFile(Uri.fromFile(destination))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.READ)))

    assertThrows(InvalidPermissionException::class.java) {
      resolveDownloadDestination(file, URI("https://127.0.0.1:1/file.txt"))
    }
  }

  // Watching a directory leaks the names of the files inside it and every change to them, so it
  // needs read permission just like reading them would.
  @Test
  fun watchingRequiresReadPermissionOnTheWatchedPath() {
    val watched = temporaryFolder.newFolder("watched")
    val appContext = createAppContext(
      permissionServiceReturning(EnumSet.noneOf(FilePermissionService.Permission::class.java))
    )

    assertThrows(WatcherPermissionException::class.java) {
      FileSystemWatcher(appContext, Uri.fromFile(watched), null)
    }
  }

  private fun permissionServiceReturning(permissions: EnumSet<FilePermissionService.Permission>) =
    object : FilePermissionService() {
      override fun getPathPermissions(
        context: android.content.Context,
        path: String
      ): EnumSet<Permission> = permissions
    }

  // See the matching note in FileSystemFileTest: the context graph is held through
  // WeakReferences, so it has to be retained here for the lifetime of the test or permission
  // checks fail spuriously with ReactContextLost instead of the behavior under test.
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
