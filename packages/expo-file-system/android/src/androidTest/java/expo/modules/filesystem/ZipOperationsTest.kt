package expo.modules.filesystem

import android.net.Uri
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.util.zip.ZipFile as JavaZipFile

class ZipOperationsTest {

  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  private fun getTestDir() = File(context.cacheDir, "zip_test_${System.currentTimeMillis()}").apply {
    deleteRecursively()
    mkdirs()
  }

  private fun File.toUri(): Uri = Uri.parse(this.toURI().toString())

  private fun createFileSystemFile(file: File): FileSystemFile = FileSystemFile(file.toUri())
  private fun createFileSystemDirectory(dir: File): FileSystemDirectory = FileSystemDirectory(dir.toUri())

  @Test
  fun testZipSingleFile() {
    val testDir = getTestDir()
    val srcFile = File(testDir, "hello.txt").apply { writeText("Hello World") }
    val destFile = File(testDir, "output.zip")

    val source = createFileSystemFile(srcFile)
    val dest = createFileSystemFile(destFile)

    val result = ZipOperations.zip(listOf(source), dest, ZipOptions())

    assertTrue("Zip file should exist", destFile.exists())
    JavaZipFile(destFile).use { zip ->
      val entries = zip.entries().toList()
      assertEquals("Should contain 1 entry", 1, entries.size)
      assertEquals("hello.txt", entries[0].name)
    }
  }

  @Test
  fun testZipDirectory_IncludeRootDirectory() {
    val testDir = getTestDir()
    val sourceDir = File(testDir, "Photos").apply {
      mkdirs()
      File(this, "a.txt").writeText("A")
      File(this, "b.txt").writeText("B")
    }
    val destFile = File(testDir, "output.zip")

    val source = createFileSystemDirectory(sourceDir)
    val dest = createFileSystemFile(destFile)

    ZipOperations.zip(listOf(source), dest, ZipOptions(includeRootDirectory = true))

    JavaZipFile(destFile).use { zip ->
      val entryNames = zip.entries().toList().map { it.name }.sorted()
      assertTrue("Should contain Photos/ prefix", entryNames.any { it.startsWith("Photos/") })
    }
  }

  @Test
  fun testZipDirectory_ExcludeRootDirectory() {
    val testDir = getTestDir()
    val sourceDir = File(testDir, "Photos").apply {
      mkdirs()
      File(this, "a.txt").writeText("A")
      File(this, "b.txt").writeText("B")
    }
    val destFile = File(testDir, "output.zip")

    val source = createFileSystemDirectory(sourceDir)
    val dest = createFileSystemFile(destFile)

    ZipOperations.zip(listOf(source), dest, ZipOptions(includeRootDirectory = false))

    JavaZipFile(destFile).use { zip ->
      val entryNames = zip.entries().toList().map { it.name }.sorted()
      assertFalse("Should NOT contain Photos/ prefix", entryNames.any { it.startsWith("Photos/") })
      assertTrue("Should contain a.txt", entryNames.contains("a.txt"))
    }
  }

  @Test
  fun testUnzipBasic() {
    val testDir = getTestDir()

    // First create a zip
    val sourceDir = File(testDir, "src").apply {
      mkdirs()
      File(this, "data.txt").writeText("test data")
    }
    val zipFile = File(testDir, "test.zip")
    ZipOperations.zip(
      listOf(createFileSystemDirectory(sourceDir)),
      createFileSystemFile(zipFile),
      ZipOptions(includeRootDirectory = false)
    )

    // Now unzip
    val destDir = File(testDir, "output").apply { mkdirs() }
    ZipOperations.unzip(
      createFileSystemFile(zipFile),
      createFileSystemDirectory(destDir),
      UnzipOptions()
    )

    val extractedFile = File(destDir, "data.txt")
    assertTrue("Extracted file should exist", extractedFile.exists())
    assertEquals("test data", extractedFile.readText())
  }

  @Test
  fun testUnzip_CreateContainingDirectory() {
    val testDir = getTestDir()

    val sourceDir = File(testDir, "src").apply {
      mkdirs()
      File(this, "file.txt").writeText("content")
    }
    val zipFile = File(testDir, "archive.zip")
    ZipOperations.zip(
      listOf(createFileSystemDirectory(sourceDir)),
      createFileSystemFile(zipFile),
      ZipOptions(includeRootDirectory = false)
    )

    val destDir = File(testDir, "output").apply { mkdirs() }
    ZipOperations.unzip(
      createFileSystemFile(zipFile),
      createFileSystemDirectory(destDir),
      UnzipOptions(createContainingDirectory = true)
    )

    val containingDir = File(destDir, "archive")
    assertTrue("Containing directory should exist", containingDir.exists())
    assertTrue("File should be inside containing dir", File(containingDir, "file.txt").exists())
  }

  @Test
  fun testDestinationResolution_DirectoryDestination() {
    val testDir = getTestDir()
    val srcFile = File(testDir, "mydata.txt").apply { writeText("data") }
    val destDir = File(testDir, "out").apply { mkdirs() }

    ZipOperations.zip(
      listOf(createFileSystemFile(srcFile)),
      createFileSystemDirectory(destDir),
      ZipOptions()
    )

    val expectedZip = File(destDir, "mydata.txt.zip")
    assertTrue("Auto-named zip should exist", expectedZip.exists())
  }

  @Test(expected = DestinationAlreadyExistsException::class)
  fun testZip_ThrowsWhenDestinationExists_AndOverwriteIsFalse() {
    val testDir = getTestDir()
    val srcFile = File(testDir, "src.txt").apply { writeText("data") }
    val destFile = File(testDir, "out.zip").apply { writeText("existing") }

    ZipOperations.zip(
      listOf(createFileSystemFile(srcFile)),
      createFileSystemFile(destFile),
      ZipOptions(overwrite = false)
    )
  }

  @Test(expected = ZipSourceNotFoundException::class)
  fun testZip_ThrowsWhenSourceDoesNotExist() {
    val testDir = getTestDir()
    val nonExistent = File(testDir, "nope.txt")
    val destFile = File(testDir, "out.zip")

    ZipOperations.zip(
      listOf(createFileSystemFile(nonExistent)),
      createFileSystemFile(destFile),
      ZipOptions()
    )
  }
}
