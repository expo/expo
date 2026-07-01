package expo.modules.filesystem

import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.FilePermissionService
import expo.modules.kotlin.services.Service
import java.io.File
import java.lang.ref.WeakReference
import java.nio.file.Files
import java.util.EnumSet
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RuntimeEnvironment
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class FileSystemFileTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  @Test
  fun createRejectsContentUriBeforeResolvingFileType() {
    val file = FileSystemFile(Uri.parse("content://com.android.externalstorage.documents/tree/primary%3ADownload"))

    val exception = assertThrows(UnableToCreateException::class.java) {
      file.create()
    }

    assertTrue(
      exception.message?.contains("File.create") == true &&
        exception.message?.contains("Directory.createFile") == true
    )
  }

  @Test
  fun fileModeRequiredPermissionsMatchHandleAccess() {
    assertEquals(listOf(FilePermissionService.Permission.READ), FileMode.READ.requiredPermissions())
    assertEquals(listOf(FilePermissionService.Permission.WRITE), FileMode.WRITE.requiredPermissions())
    assertEquals(listOf(FilePermissionService.Permission.WRITE), FileMode.APPEND.requiredPermissions())
    assertEquals(listOf(FilePermissionService.Permission.WRITE), FileMode.TRUNCATE.requiredPermissions())
    assertEquals(
      listOf(FilePermissionService.Permission.READ, FilePermissionService.Permission.WRITE),
      FileMode.READ_WRITE.requiredPermissions()
    )
  }

  @Test
  fun openHandleRequiresPermissionsMatchingFileModeBeforeOpeningFile() {
    val source = temporaryFolder.newFile("read-write.txt").apply {
      writeText("content")
    }
    val file = FileSystemFile(Uri.fromFile(source))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.READ)))

    assertThrows(InvalidPermissionException::class.java) {
      file.openHandle(FileMode.READ_WRITE)
    }
  }

  @Test
  fun openHandleRejectsReadWriteForSAFContentUriBeforeOpeningProvider() {
    val file = FileSystemFile(Uri.parse("content://com.android.externalstorage.documents/tree/primary%3ADownload"))
      .withAppContext(permissionServiceReturning(EnumSet.allOf(FilePermissionService.Permission::class.java)))

    val exception = assertThrows(UnsupportedContentUriReadWriteException::class.java) {
      file.openHandle(FileMode.READ_WRITE)
    }

    assertTrue(exception.message?.contains("READ_WRITE mode is not supported for content:// URIs") == true)
  }

  @Test
  fun openHandleRejectsReadWriteForGenericContentUriBeforeOpeningProvider() {
    val file = FileSystemFile(Uri.parse("content://expo-file-system-test-provider/file.txt"))
      .withAppContext(permissionServiceReturning(EnumSet.allOf(FilePermissionService.Permission::class.java)))

    val exception = assertThrows(UnsupportedContentUriReadWriteException::class.java) {
      file.openHandle(FileMode.READ_WRITE)
    }

    assertTrue(exception.message?.contains("READ_WRITE mode is not supported for content:// URIs") == true)
  }

  @Test
  fun deleteRequiresWritePermissionBeforeDeletingFile() {
    val source = temporaryFolder.newFile("delete-target.txt")
    val file = FileSystemFile(Uri.fromFile(source))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.READ)))

    assertThrows(InvalidPermissionException::class.java) {
      file.delete()
    }

    assertTrue(source.exists())
  }

  @Test
  fun createFileRejectsChildNameThatEscapesParentDirectory() {
    val parent = temporaryFolder.newFolder("parent")
    val escaped = File(parent.parentFile, "escaped.txt")
    val directory = FileSystemDirectory(Uri.fromFile(parent))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.WRITE)))

    assertThrows(UnableToCreateException::class.java) {
      directory.createFile("text/plain", "../escaped.txt")
    }

    assertFalse(escaped.exists())
  }

  @Test
  fun createFileRejectsSingleSegmentSymlinkThatEscapesParentDirectory() {
    val parent = temporaryFolder.newFolder("parent-with-file-link")
    val escaped = temporaryFolder.newFile("linked-outside.txt")
    createSymbolicLink(File(parent, "linked-file"), escaped)
    val directory = FileSystemDirectory(Uri.fromFile(parent))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.WRITE)))

    assertThrows(UnableToCreateException::class.java) {
      directory.createFile("text/plain", "linked-file")
    }
  }

  @Test
  fun createDirectoryRejectsChildNameThatEscapesParentDirectory() {
    val parent = temporaryFolder.newFolder("parent-dir")
    val escaped = File(parent.parentFile, "escaped-dir")
    val directory = FileSystemDirectory(Uri.fromFile(parent))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.WRITE)))

    assertThrows(UnableToCreateException::class.java) {
      directory.createDirectory("../escaped-dir")
    }

    assertFalse(escaped.exists())
  }

  @Test
  fun createDirectoryRejectsSingleSegmentSymlinkThatEscapesParentDirectory() {
    val parent = temporaryFolder.newFolder("parent-with-dir-link")
    val escaped = temporaryFolder.newFolder("linked-outside-dir")
    createSymbolicLink(File(parent, "linked-dir"), escaped)
    val directory = FileSystemDirectory(Uri.fromFile(parent))
      .withAppContext(permissionServiceReturning(EnumSet.of(FilePermissionService.Permission.WRITE)))

    assertThrows(UnableToCreateException::class.java) {
      directory.createDirectory("linked-dir")
    }
  }

  @Test
  fun renameRejectsChildNameThatEscapesParentDirectory() {
    val parent = temporaryFolder.newFolder("rename-parent")
    val source = File(parent, "source.txt").apply {
      writeText("content")
    }
    val escaped = File(parent.parentFile, "renamed-outside.txt")
    val file = FileSystemFile(Uri.fromFile(source))
      .withAppContext(
        permissionServiceReturning(
          EnumSet.of(FilePermissionService.Permission.READ, FilePermissionService.Permission.WRITE)
        )
      )

    assertThrows(UnableToCreateException::class.java) {
      file.rename("../renamed-outside.txt")
    }

    assertTrue(source.exists())
    assertFalse(escaped.exists())
  }

  @Test
  fun renameRejectsSingleSegmentSymlinkThatEscapesParentDirectory() {
    val parent = temporaryFolder.newFolder("rename-parent-with-link")
    val source = File(parent, "source.txt").apply {
      writeText("content")
    }
    val escaped = temporaryFolder.newFile("rename-linked-outside.txt")
    createSymbolicLink(File(parent, "linked-file"), escaped)
    val file = FileSystemFile(Uri.fromFile(source))
      .withAppContext(
        permissionServiceReturning(
          EnumSet.of(FilePermissionService.Permission.READ, FilePermissionService.Permission.WRITE)
        )
      )

    assertThrows(UnableToCreateException::class.java) {
      file.rename("linked-file")
    }

    assertTrue(source.exists())
  }

  private fun createSymbolicLink(link: File, target: File) {
    Files.createSymbolicLink(link.toPath(), target.toPath())
  }

  private fun permissionServiceReturning(permissions: EnumSet<FilePermissionService.Permission>) =
    object : FilePermissionService() {
      override fun getPathPermissions(
        context: android.content.Context,
        path: String
      ): EnumSet<Permission> = permissions
    }

  private fun createAppContext(permissionService: FilePermissionService): AppContext {
    val reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
    return AppContext(
      object : ModulesProvider {
        override fun getModulesMap(): Map<Class<out Module>, String?> = emptyMap()
        override fun getServices(): List<Class<out Service>> = emptyList()
      },
      expo.modules.core.ModuleRegistry(emptyList(), emptyList()),
      WeakReference(reactContext)
    ).also {
      it.services.register(FilePermissionService::class.java, permissionService)
    }
  }

  private fun <T : FileSystemPath> T.withAppContext(permissionService: FilePermissionService): T =
    apply {
      runtimeContextHolder = WeakReference(createAppContext(permissionService).runtime)
    }
}
