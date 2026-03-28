package expo.modules.filesystem

import android.net.Uri
import android.provider.DocumentsContract
import androidx.documentfile.provider.DocumentFile
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class ZipArchiveTest {

  private val context = InstrumentationRegistry.getInstrumentation().targetContext
  private val resolver = context.contentResolver

  private fun getTestDir() = File(context.cacheDir, "zip_archive_test_${System.currentTimeMillis()}").apply {
    deleteRecursively()
    mkdirs()
  }

  private fun getSAFRootDir(): DocumentFile {
    val safRootUri = DocumentsContract.buildTreeDocumentUri(
      TestStorageProvider.AUTHORITY,
      TestStorageProvider.ROOT_DOC_ID
    )
    return DocumentFile.fromTreeUri(context, safRootUri)!!.apply {
      listFiles().forEach { it.delete() }
    }
  }

  private fun File.toUri(): Uri = Uri.parse(this.toURI().toString())
  private fun createFileSystemFile(file: File) = FileSystemFile(file.toUri())
  private fun createFileSystemDirectory(dir: File) = FileSystemDirectory(dir.toUri())

  private fun createTestZip(testDir: File): File {
    val sourceDir = File(testDir, "src").apply {
      mkdirs()
      File(this, "hello.txt").writeText("Hello World")
      File(this, "sub").mkdirs()
      File(this, "sub/nested.txt").writeText("Nested content")
    }
    val zipFile = File(testDir, "test.zip")
    ZipOperations.zip(
      listOf(createFileSystemDirectory(sourceDir)),
      createFileSystemFile(zipFile),
      ZipOptions(includeRootDirectory = false)
    )
    return zipFile
  }

  @Test
  fun testListEntries() {
    val testDir = getTestDir()
    val zipFile = createTestZip(testDir)

    val archive = ZipArchive(createFileSystemFile(zipFile))
    val entries = archive.list()

    assertTrue("Should have entries", entries.isNotEmpty())
    assertTrue("Should contain hello.txt", entries.any { it.name == "hello.txt" })
    assertTrue("Should contain sub/nested.txt", entries.any { it.name == "sub/nested.txt" })

    archive.close()
  }

  @Test
  fun testListEntries_Metadata() {
    val testDir = getTestDir()
    val zipFile = createTestZip(testDir)

    val archive = ZipArchive(createFileSystemFile(zipFile))
    val entries = archive.list()

    val helloEntry = entries.find { it.name == "hello.txt" }
    assertNotNull("hello.txt entry should exist", helloEntry)
    assertFalse("hello.txt should not be directory", helloEntry!!.isDirectory)
    assertTrue("hello.txt should have non-zero size", helloEntry.size > 0)
    assertNotNull("Should have crc32", helloEntry.crc32)
    assertNotNull("Should have lastModified", helloEntry.lastModified)

    archive.close()
  }

  @Test
  fun testExtractEntry_ToFile() {
    val testDir = getTestDir()
    val zipFile = createTestZip(testDir)

    val archive = ZipArchive(createFileSystemFile(zipFile))

    val destFile = File(testDir, "extracted.txt")
    val result = archive.extractEntry("hello.txt", createFileSystemFile(destFile))

    assertTrue("Extracted file should exist", destFile.exists())
    assertEquals("Hello World", destFile.readText())

    archive.close()
  }

  @Test
  fun testExtractEntry_ToDirectory() {
    val testDir = getTestDir()
    val zipFile = createTestZip(testDir)

    val archive = ZipArchive(createFileSystemFile(zipFile))

    val destDir = File(testDir, "out").apply { mkdirs() }
    archive.extractEntry("hello.txt", createFileSystemDirectory(destDir))

    val extractedFile = File(destDir, "hello.txt")
    assertTrue("Extracted file should exist in directory", extractedFile.exists())
    assertEquals("Hello World", extractedFile.readText())

    archive.close()
  }

  @Test
  fun testAsFile() {
    val testDir = getTestDir()
    val zipFile = createTestZip(testDir)
    val sourceFileSystem = createFileSystemFile(zipFile)

    val archive = ZipArchive(sourceFileSystem)
    val file = archive.asFile()

    assertEquals("Should return same URI", sourceFileSystem.uri, file.uri)

    archive.close()
  }

  @Test(expected = UnableToUnzipException::class)
  fun testExtractEntry_NotFound() {
    val testDir = getTestDir()
    val zipFile = createTestZip(testDir)

    val archive = ZipArchive(createFileSystemFile(zipFile))
    val destFile = File(testDir, "nope.txt")

    try {
      archive.extractEntry("nonexistent.txt", createFileSystemFile(destFile))
    } finally {
      archive.close()
    }
  }

  @Test
  fun testListEntries_FromSafArchive() {
    val testDir = getTestDir()
    val safRootDir = getSAFRootDir()
    val zipFile = createTestZip(testDir)

    val safArchive = safRootDir.createFile("application/zip", "test.zip")
    assertNotNull("Failed to create SAF archive", safArchive)
    resolver.openOutputStream(safArchive!!.uri)?.use { output ->
      zipFile.inputStream().use { input ->
        input.copyTo(output)
      }
    }

    val archive = ZipArchive(FileSystemFile(safArchive.uri))
    val entries = archive.list()

    assertTrue("Should have entries from SAF archive", entries.isNotEmpty())
    assertTrue("Should contain hello.txt", entries.any { it.name == "hello.txt" })
    assertTrue("Should contain sub/nested.txt", entries.any { it.name == "sub/nested.txt" })

    archive.close()
  }

  @Test
  fun testExtractEntry_ToSafDirectory() {
    val testDir = getTestDir()
    val safRootDir = getSAFRootDir()
    val zipFile = createTestZip(testDir)

    val archive = ZipArchive(createFileSystemFile(zipFile))
    val outputDir = safRootDir.createDirectory("out")
    assertNotNull("Failed to create SAF output directory", outputDir)

    archive.extractEntry("hello.txt", FileSystemDirectory(outputDir!!.uri))

    val extractedFile = outputDir.findFile("hello.txt")
    assertNotNull("Extracted file should exist in SAF directory", extractedFile)
    val content = resolver.openInputStream(extractedFile!!.uri)?.bufferedReader()?.readText()
    assertEquals("Hello World", content)

    archive.close()
  }
}
