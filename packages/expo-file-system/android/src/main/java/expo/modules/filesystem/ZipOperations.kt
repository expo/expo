package expo.modules.filesystem

import android.net.Uri
import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

private const val BUFFER_SIZE = 64 * 1024

internal object ZipOperations {

  fun zip(
    sources: List<FileSystemPath>,
    destination: FileSystemPath,
    options: ZipOptions
  ): FileSystemFile {
    if (sources.isEmpty()) {
      throw UnableToZipException("sources list is empty")
    }

    // Validate sources exist
    for (source in sources) {
      if (!source.file.exists()) {
        throw ZipSourceNotFoundException(source.file.uri.toString())
      }
    }

    // Resolve destination path
    val destFile = resolveZipDestination(destination, sources.first())

    // Handle overwrite
    if (destFile.exists()) {
      if (!options.overwrite) {
        throw DestinationAlreadyExistsException()
      }
      destFile.delete()
    }

    // Ensure parent directory exists
    destFile.parentFile?.mkdirs()

    ZipOutputStream(BufferedOutputStream(FileOutputStream(destFile), BUFFER_SIZE)).use { zos ->
      zos.setLevel(options.compressionLevel.value)

      for (source in sources) {
        val unifiedFile = source.file
        if (unifiedFile.isDirectory()) {
          addDirectoryToZip(zos, unifiedFile, options.includeRootDirectory)
        } else {
          addFileToZip(zos, unifiedFile, unifiedFile.fileName ?: "file")
        }
      }
    }

    return FileSystemFile(Uri.fromFile(destFile))
  }

  fun unzip(
    source: FileSystemFile,
    destination: FileSystemDirectory,
    options: UnzipOptions
  ): FileSystemDirectory {
    if (!source.file.exists()) {
      throw ZipSourceNotFoundException(source.file.uri.toString())
    }

    var destDir = File(destination.file.uri.path!!)

    if (options.createContainingDirectory) {
      val archiveName = source.file.fileName?.removeSuffix(".zip") ?: "archive"
      destDir = File(destDir, archiveName)
    }

    if (!destDir.exists()) {
      destDir.mkdirs()
    }

    // Use ZipInputStream for universal compatibility (works with SAF URIs too)
    source.file.inputStream().use { rawInput ->
      ZipInputStream(BufferedInputStream(rawInput, BUFFER_SIZE)).use { zis ->
        var entry = zis.nextEntry
        while (entry != null) {
          val outputFile = File(destDir, entry.name)

          // Zip slip protection
          if (!outputFile.canonicalPath.startsWith(destDir.canonicalPath + File.separator) &&
            outputFile.canonicalPath != destDir.canonicalPath) {
            throw UnableToUnzipException("entry '${entry.name}' is outside of the target directory (zip slip)")
          }

          if (entry.isDirectory) {
            outputFile.mkdirs()
          } else {
            outputFile.parentFile?.mkdirs()

            if (outputFile.exists() && !options.overwrite) {
              zis.closeEntry()
              entry = zis.nextEntry
              continue
            }

            FileOutputStream(outputFile).use { fos ->
              zis.copyTo(fos, BUFFER_SIZE)
            }
          }
          zis.closeEntry()
          entry = zis.nextEntry
        }
      }
    }

    return FileSystemDirectory(Uri.fromFile(destDir))
  }

  private fun resolveZipDestination(
    destination: FileSystemPath,
    firstSource: FileSystemPath
  ): File {
    return if (destination is FileSystemDirectory) {
      val sourceName = firstSource.file.fileName ?: "archive"
      val zipName = if (sourceName.endsWith(".zip")) sourceName else "$sourceName.zip"
      File(destination.file.uri.path!!, zipName)
    } else {
      File(destination.file.uri.path!!)
    }
  }

  private fun addDirectoryToZip(
    zos: ZipOutputStream,
    directory: UnifiedFileInterface,
    includeRootDirectory: Boolean
  ) {
    val basePath = if (includeRootDirectory) (directory.fileName ?: "") + "/" else ""

    directory.walkTopDown().forEach { file ->
      val relativePath = getRelativePath(directory, file)
      val entryPath = if (includeRootDirectory) basePath + relativePath else relativePath

      if (entryPath.isEmpty()) return@forEach // skip root itself when not including

      if (file.isDirectory()) {
        val dirEntry = ZipEntry(if (entryPath.endsWith("/")) entryPath else "$entryPath/")
        zos.putNextEntry(dirEntry)
        zos.closeEntry()
      } else {
        addFileToZip(zos, file, entryPath)
      }
    }
  }

  private fun addFileToZip(
    zos: ZipOutputStream,
    file: UnifiedFileInterface,
    entryPath: String
  ) {
    val entry = ZipEntry(entryPath)
    zos.putNextEntry(entry)
    file.inputStream().use { input ->
      input.copyTo(zos, BUFFER_SIZE)
    }
    zos.closeEntry()
  }

  private fun getRelativePath(
    base: UnifiedFileInterface,
    target: UnifiedFileInterface
  ): String {
    val basePath = base.uri.path?.trimEnd('/') ?: ""
    val targetPath = target.uri.path?.trimEnd('/') ?: ""
    return if (targetPath.startsWith(basePath)) {
      targetPath.removePrefix(basePath).trimStart('/')
    } else {
      target.fileName ?: ""
    }
  }
}
