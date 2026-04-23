package expo.modules.filesystem

import android.net.Uri
import android.os.Build
import expo.modules.filesystem.unifiedfile.JavaFile
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.nio.file.Files
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.R])
class ZipOperationsBehaviorTest {
  @Test
  fun `extractZipEntries throws for non-zip input`() {
    val tempDir = Files.createTempDirectory("expo-file-system-zip-invalid").toFile()

    try {
      val sourceFile = File(tempDir, "not-a-zip.zip").apply {
        writeText("this is not a zip file")
      }
      val destinationDir = File(tempDir, "output").apply {
        mkdirs()
      }

      assertThrows(UnableToUnzipException::class.java) {
        ZipOperations.extractZipEntries(
          JavaFile(Uri.fromFile(sourceFile)),
          JavaFile(Uri.fromFile(destinationDir)),
          UnzipOptions()
        )
      }
    } finally {
      tempDir.deleteRecursively()
    }
  }

  @Test
  fun `extractZipEntries throws when overwrite is false and destination file exists`() {
    val tempDir = Files.createTempDirectory("expo-file-system-zip-overwrite").toFile()

    try {
      val sourceFile = File(tempDir, "archive.zip")
      ZipOutputStream(sourceFile.outputStream()).use { output ->
        output.putNextEntry(ZipEntry("conflict.txt"))
        output.write("new contents".toByteArray())
        output.closeEntry()
      }

      val destinationDir = File(tempDir, "output").apply {
        mkdirs()
      }
      File(destinationDir, "conflict.txt").writeText("existing contents")

      assertThrows(UnableToUnzipException::class.java) {
        ZipOperations.extractZipEntries(
          JavaFile(Uri.fromFile(sourceFile)),
          JavaFile(Uri.fromFile(destinationDir)),
          UnzipOptions(overwrite = false)
        )
      }
    } finally {
      tempDir.deleteRecursively()
    }
  }
}
