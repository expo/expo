package expo.modules.filesystem

import android.net.Uri
import android.provider.DocumentsContract
import androidx.documentfile.provider.DocumentFile
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.filesystem.fsops.DestinationSpec
import expo.modules.filesystem.unifiedfile.JavaFile
import expo.modules.filesystem.unifiedfile.SAFDocumentFile
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Comprehensive tests for copy/move operations across different file backends.
 * Tests cover:
 * - Copy operations (local, SAF, cross-backend)
 * - Move operations (local, SAF, cross-backend)
 * - Error handling and edge cases
 * - Unix cp/mv behavior semantics
 */
class CopyMoveOperationsTest {

  private val context = InstrumentationRegistry.getInstrumentation().targetContext
  private val resolver = context.contentResolver

  // ============================================================================
  // TEST HELPERS
  // ============================================================================

  private fun getLocalTestDir() = File(context.cacheDir, "test_${System.currentTimeMillis()}").apply {
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

  // ============================================================================
  // COPY OPERATIONS: LOCAL → LOCAL
  // ============================================================================

  @Test
  fun testCopyLocalFile_ToLocalFile() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("test content") }
    val dstFile = File(localTestDir, "dest.txt")

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstFile.toUri())

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = false))

    assertTrue("Source should still exist after copy", srcFile.exists())
    assertTrue("Destination should exist", dstFile.exists())
    assertEquals("test content", dstFile.readText())
  }

  @Test
  fun testCopyLocalFile_ToLocalDirectory() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("test content") }
    val dstDir = File(localTestDir, "destDir").apply { mkdirs() }

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstDir.toUri())

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val copiedFile = File(dstDir, "source.txt")
    assertTrue("File should be created inside destination directory", copiedFile.exists())
    assertEquals("test content", copiedFile.readText())
  }

  @Test
  fun testCopyLocalDirectory_ToLocalDirectory() {
    val localTestDir = getLocalTestDir()

    val srcDir = File(localTestDir, "srcDir").apply { mkdirs() }
    File(srcDir, "file1.txt").writeText("content1")
    File(srcDir, "file2.txt").writeText("content2")

    val dstDir = File(localTestDir, "dstDir").apply { mkdirs() }

    val source = JavaFile(srcDir.toUri())
    val dest = JavaFile(dstDir.toUri())

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val copiedDir = File(dstDir, "srcDir")
    assertTrue(copiedDir.exists() && copiedDir.isDirectory)
    assertTrue(File(copiedDir, "file1.txt").exists())
    assertTrue(File(copiedDir, "file2.txt").exists())
    assertEquals("content1", File(copiedDir, "file1.txt").readText())
  }

  // ============================================================================
  // COPY OPERATIONS: SAF → SAF
  // ============================================================================

  @Test
  fun testCopySAFFile_ToSAFFile() {
    val safRootDir = getSAFRootDir()

    val srcDoc = safRootDir.createFile("text/plain", "source.txt")
    assertNotNull("Failed to create source file", srcDoc)
    resolver.openOutputStream(srcDoc!!.uri)?.use { it.write("saf content".toByteArray()) }

    // For SAF, we need to create the destination file to get a URI
    // Then copy with overwrite=true to write the content
    val dstDoc = safRootDir.createFile("text/plain", "dest.txt")
    assertNotNull("Failed to create destination file", dstDoc)

    val source = SAFDocumentFile(context, srcDoc.uri)
    val dest = SAFDocumentFile(context, dstDoc!!.uri)

    source.copyTo(DestinationSpec(path = dest, overwrite = true, isDirectory = false))

    val content = resolver.openInputStream(dstDoc.uri)?.bufferedReader()?.readText()
    assertEquals("saf content", content)
  }

  @Test
  fun testCopySAFFile_ToSAFDirectory() {
    val safRootDir = getSAFRootDir()

    val srcDoc = safRootDir.createFile("text/plain", "source.txt")!!
    resolver.openOutputStream(srcDoc.uri)?.use { it.write("saf content".toByteArray()) }

    val dstDir = safRootDir.createDirectory("targetDir")!!

    val source = SAFDocumentFile(context, srcDoc.uri)
    val dest = SAFDocumentFile(context, dstDir.uri)

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val copiedFile = dstDir.findFile("source.txt")
    assertNotNull("File should be created inside destination directory", copiedFile)
    val content = resolver.openInputStream(copiedFile!!.uri)?.bufferedReader()?.readText()
    assertEquals("saf content", content)
  }

  @Test
  fun testCopySAFDirectory_ToSAFDirectory() {
    val safRootDir = getSAFRootDir()

    val srcDir = safRootDir.createDirectory("srcDir")!!
    val file1 = srcDir.createFile("text/plain", "file1.txt")!!
    resolver.openOutputStream(file1.uri)?.use { it.write("content1".toByteArray()) }

    val dstDir = safRootDir.createDirectory("dstDir")!!

    val source = SAFDocumentFile(context, srcDir.uri)
    val dest = SAFDocumentFile(context, dstDir.uri)

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val copiedDir = dstDir.findFile("srcDir")
    assertNotNull("Directory should be created inside destination", copiedDir)
    assertTrue(copiedDir!!.isDirectory)

    val copiedFile = copiedDir.findFile("file1.txt")
    assertNotNull(copiedFile)
    val content = resolver.openInputStream(copiedFile!!.uri)?.bufferedReader()?.readText()
    assertEquals("content1", content)
  }

  // ============================================================================
  // COPY OPERATIONS: CROSS-BACKEND (SAF → LOCAL)
  // ============================================================================

  @Test
  fun testCopySAFFile_ToLocalFile() {
    val safRootDir = getSAFRootDir()
    val localTestDir = getLocalTestDir()

    val srcDoc = safRootDir.createFile("text/plain", "source.txt")!!
    resolver.openOutputStream(srcDoc.uri)?.use { it.write("saf to local".toByteArray()) }

    val dstFile = File(localTestDir, "dest.txt")

    val source = SAFDocumentFile(context, srcDoc.uri)
    val dest = JavaFile(dstFile.toUri())

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = false))

    assertTrue(dstFile.exists())
    assertEquals("saf to local", dstFile.readText())
  }

  @Test
  fun testCopySAFFile_ToLocalDirectory() {
    val safRootDir = getSAFRootDir()
    val localTestDir = getLocalTestDir()

    val srcDoc = safRootDir.createFile("text/plain", "source.txt")!!
    resolver.openOutputStream(srcDoc.uri)?.use { it.write("saf content".toByteArray()) }

    val dstDir = File(localTestDir, "destDir").apply { mkdirs() }

    val source = SAFDocumentFile(context, srcDoc.uri)
    val dest = JavaFile(dstDir.toUri())

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val copiedFile = File(dstDir, "source.txt")
    assertTrue(copiedFile.exists())
    assertEquals("saf content", copiedFile.readText())
  }

  // ============================================================================
  // COPY OPERATIONS: CROSS-BACKEND (LOCAL → SAF)
  // ============================================================================

  @Test
  fun testCopyLocalFile_ToSAFDirectory() {
    val safRootDir = getSAFRootDir()
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("local content") }
    val dstDir = safRootDir.createDirectory("targetDir")!!

    val source = JavaFile(srcFile.toUri())
    val dest = SAFDocumentFile(context, dstDir.uri)

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val copiedFile = dstDir.findFile("source.txt")
    assertNotNull(copiedFile)
    val content = resolver.openInputStream(copiedFile!!.uri)?.bufferedReader()?.readText()
    assertEquals("local content", content)
  }

  @Test
  fun testCopyLocalDirectory_ToSAFDirectory() {
    val safRootDir = getSAFRootDir()
    val localTestDir = getLocalTestDir()

    val srcDir = File(localTestDir, "srcDir").apply { mkdirs() }
    File(srcDir, "nested.txt").writeText("nested content")

    val dstDir = safRootDir.createDirectory("dstDir")!!

    val source = JavaFile(srcDir.toUri())
    val dest = SAFDocumentFile(context, dstDir.uri)

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val copiedDir = dstDir.findFile("srcDir")
    assertNotNull(copiedDir)
    assertTrue(copiedDir!!.isDirectory)

    val copiedFile = copiedDir.findFile("nested.txt")
    assertNotNull(copiedFile)
    val content = resolver.openInputStream(copiedFile!!.uri)?.bufferedReader()?.readText()
    assertEquals("nested content", content)
  }

  // ============================================================================
  // MOVE OPERATIONS: LOCAL → LOCAL
  // ============================================================================

  @Test
  fun testMoveLocalFile_ToLocalFile() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("move content") }
    val dstFile = File(localTestDir, "dest.txt")

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstFile.toUri())

    val resultUri = source.moveTo(DestinationSpec(path = dest, overwrite = false, isDirectory = false))

    assertFalse("Source should not exist after move", srcFile.exists())
    assertTrue("Destination should exist", dstFile.exists())
    assertEquals("move content", dstFile.readText())
    assertEquals(dstFile.toUri(), resultUri)
  }

  @Test
  fun testMoveLocalFile_ToLocalDirectory() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("move content") }
    val dstDir = File(localTestDir, "destDir").apply { mkdirs() }

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstDir.toUri())

    source.moveTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    assertFalse("Source should not exist after move", srcFile.exists())
    val movedFile = File(dstDir, "source.txt")
    assertTrue(movedFile.exists())
    assertEquals("move content", movedFile.readText())
  }

  // ============================================================================
  // MOVE OPERATIONS: CROSS-BACKEND (SAF ↔ LOCAL)
  // ============================================================================

  @Test
  fun testMoveSAFFile_ToLocalDirectory() {
    val safRootDir = getSAFRootDir()
    val localTestDir = getLocalTestDir()

    val srcDoc = safRootDir.createFile("text/plain", "source.txt")!!
    resolver.openOutputStream(srcDoc.uri)?.use { it.write("saf to local move".toByteArray()) }

    val dstDir = File(localTestDir, "destDir").apply { mkdirs() }

    val source = SAFDocumentFile(context, srcDoc.uri)
    val dest = JavaFile(dstDir.toUri())

    source.moveTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val movedFile = File(dstDir, "source.txt")
    assertTrue("Destination file should exist at ${movedFile.absolutePath}", movedFile.exists())
    assertEquals("saf to local move", movedFile.readText())

    // Check if source was deleted by looking in the parent directory
    val sourceStillExists = safRootDir.findFile("source.txt") != null
    assertFalse("Source file should not exist after move", sourceStillExists)
  }

  @Test
  fun testMoveLocalFile_ToSAFDirectory() {
    val safRootDir = getSAFRootDir()
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("local to saf move") }
    val dstDir = safRootDir.createDirectory("targetDir")!!

    val source = JavaFile(srcFile.toUri())
    val dest = SAFDocumentFile(context, dstDir.uri)

    source.moveTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    assertFalse("Source should not exist after move", srcFile.exists())
    val movedFile = dstDir.findFile("source.txt")
    assertNotNull(movedFile)
    val content = resolver.openInputStream(movedFile!!.uri)?.bufferedReader()?.readText()
    assertEquals("local to saf move", content)
  }

  // ============================================================================
  // ERROR HANDLING: OVERWRITE BEHAVIOR
  // ============================================================================

  @Test
  fun testCopy_ThrowsWhenDestinationExists_AndOverwriteIsFalse() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("source") }
    val dstFile = File(localTestDir, "dest.txt").apply { writeText("existing") }

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstFile.toUri())

    val result = runCatching {
      source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = false))
    }

    assertTrue(result.isFailure)
    assertTrue(result.exceptionOrNull()!! is DestinationAlreadyExistsException)
    assertEquals("existing", dstFile.readText())
  }

  @Test
  fun testCopy_OverwritesDestination_WhenOverwriteIsTrue() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("new content") }
    val dstFile = File(localTestDir, "dest.txt").apply { writeText("old content") }

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstFile.toUri())

    source.copyTo(DestinationSpec(path = dest, overwrite = true, isDirectory = false))

    assertEquals("new content", dstFile.readText())
  }

  @Test
  fun testMove_ThrowsWhenDestinationExists_AndOverwriteIsFalse() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("source") }
    val dstFile = File(localTestDir, "dest.txt").apply { writeText("existing") }

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstFile.toUri())

    val result = runCatching {
      source.moveTo(DestinationSpec(path = dest, overwrite = false, isDirectory = false))
    }

    assertTrue(result.isFailure)
    assertTrue(result.exceptionOrNull()!! is DestinationAlreadyExistsException)
    assertTrue(srcFile.exists())
  }

  @Test
  fun testMove_OverwritesDestination_WhenOverwriteIsTrue() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("new content") }
    val dstFile = File(localTestDir, "dest.txt").apply { writeText("old content") }

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstFile.toUri())

    source.moveTo(DestinationSpec(path = dest, overwrite = true, isDirectory = false))

    assertTrue(dstFile.exists())
    assertEquals("new content", dstFile.readText())
  }

  // ============================================================================
  // ERROR HANDLING: INVALID OPERATIONS
  // ============================================================================

  @Test
  fun testCopy_ThrowsWhenCopyingDirectoryToFile() {
    val localTestDir = getLocalTestDir()

    val srcDir = File(localTestDir, "srcDir").apply { mkdirs() }
    val dstFile = File(localTestDir, "dest.txt").apply { writeText("file") }

    val source = JavaFile(srcDir.toUri())
    val dest = JavaFile(dstFile.toUri())

    val result = runCatching {
      source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = false))
    }

    assertTrue("Expected exception when copying directory to file", result.isFailure)
    assertTrue(result.exceptionOrNull()!! is CopyOrMoveDirectoryToFileException)
  }

  @Test
  fun testCopy_ThrowsWhenDestinationParentDoesNotExist() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("content") }
    val dstFile = File(localTestDir, "nonexistent/dest.txt")

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstFile.toUri())

    val result = runCatching {
      source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = false))
    }

    assertTrue("Expected exception for nonexistent directory", result.isFailure)
    assertTrue(result.exceptionOrNull()!! is DestinationDoesNotExistException)
  }

  @Test
  fun testCopy_FileToNonexistentDirectory_Throws() {
    val localTestDir = getLocalTestDir()

    val srcFile = File(localTestDir, "source.txt").apply { writeText("content") }
    val dstDir = File(localTestDir, "nonexistent")

    val source = JavaFile(srcFile.toUri())
    val dest = JavaFile(dstDir.toUri())

    val result = runCatching {
      source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))
    }

    assertTrue("Expected exception for nonexistent directory", result.isFailure)
    assertTrue(result.exceptionOrNull()!! is DestinationDoesNotExistException)
  }

  // ============================================================================
  // UNIX BEHAVIOR: CP/MV SEMANTICS
  // ============================================================================

  @Test
  fun testCopyDirectory_ToExistingDirectory_CreatesChildDirectory() {
    val localTestDir = getLocalTestDir()

    val srcDir = File(localTestDir, "srcDir").apply { mkdirs() }
    File(srcDir, "file.txt").writeText("content")

    val dstDir = File(localTestDir, "destDir").apply { mkdirs() }

    val source = JavaFile(srcDir.toUri())
    val dest = JavaFile(dstDir.toUri())

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    val copiedDir = File(dstDir, "srcDir")
    assertTrue(copiedDir.exists() && copiedDir.isDirectory)
    assertTrue(File(copiedDir, "file.txt").exists())
  }

  @Test
  fun testCopyDirectory_ToNonexistentDirectory_RenamesIfParentExists() {
    val localTestDir = getLocalTestDir()

    val srcDir = File(localTestDir, "srcDir").apply { mkdirs() }
    File(srcDir, "file.txt").writeText("content")

    val dstDir = File(localTestDir, "newName") // Doesn't exist

    val source = JavaFile(srcDir.toUri())
    val dest = JavaFile(dstDir.toUri())

    source.copyTo(DestinationSpec(path = dest, overwrite = false, isDirectory = true))

    assertTrue(dstDir.exists() && dstDir.isDirectory)
    assertTrue(File(dstDir, "file.txt").exists())
  }
}
