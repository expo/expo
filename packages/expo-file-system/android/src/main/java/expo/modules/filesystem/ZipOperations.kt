package expo.modules.filesystem

import android.net.Uri
import expo.modules.filesystem.unifiedfile.UnifiedFileInterface
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.EOFException
import java.io.File
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream
import java.util.zip.ZipException

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

    val destinationFile = resolveZipDestination(destination, sources.first(), options.overwrite)

    ZipOutputStream(
      BufferedOutputStream(destinationFile.file.outputStream(append = false), BUFFER_SIZE)
    ).use { zos ->
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

    return destinationFile
  }

  fun unzip(
    source: FileSystemFile,
    destination: FileSystemDirectory,
    options: UnzipOptions
  ): FileSystemDirectory {
    if (!source.file.exists()) {
      throw ZipSourceNotFoundException(source.file.uri.toString())
    }

    val destDir = resolveUnzipDestination(destination, source, options)
    extractZipEntries(source.file, destDir.file, options)

    return destDir
  }

  internal fun extractZipEntries(
    source: UnifiedFileInterface,
    destination: UnifiedFileInterface,
    options: UnzipOptions
  ) {
    try {
      source.inputStream().use { rawInput ->
        val bufferedInput = BufferedInputStream(rawInput, BUFFER_SIZE)
        validateZipSignature(bufferedInput, source)

        ZipInputStream(bufferedInput).use { zis ->
          var entry = zis.nextEntry
          while (entry != null) {
            val pathSegments = normalizeEntryPath(entry.name)

            if (pathSegments.isNotEmpty()) {
              if (entry.isDirectory) {
                ensureDirectoryAtPath(destination, pathSegments, options.overwrite)
              } else {
                val parentDirectory = ensureDirectoryAtPath(
                  destination,
                  pathSegments.dropLast(1),
                  options.overwrite
                )
                val targetFile = resolveFileTarget(
                  parentDirectory,
                  pathSegments.last(),
                  options.overwrite
                )

                targetFile.outputStream(append = false).use { output ->
                  zis.copyTo(output, BUFFER_SIZE)
                }
              }
            }
            zis.closeEntry()
            entry = zis.nextEntry
          }
        }
      }
    } catch (error: Throwable) {
      when (error) {
        is UnableToUnzipException -> throw error
        is ZipException, is EOFException -> {
          throw UnableToUnzipException(error.message ?: "failed to read zip archive")
        }
        else -> throw error
      }
    }
  }

  private fun resolveZipDestination(
    destination: FileSystemPath,
    firstSource: FileSystemPath,
    overwrite: Boolean
  ): FileSystemFile {
    return if (destination is FileSystemDirectory) {
      val sourceName = firstSource.file.fileName ?: "archive"
      val zipName = if (sourceName.endsWith(".zip")) sourceName else "$sourceName.zip"
      resolveZipDestinationInDirectory(destination, zipName, overwrite)
    } else {
      prepareZipFileDestination(destination as FileSystemFile, overwrite)
    }
  }

  private fun resolveZipDestinationInDirectory(
    destination: FileSystemDirectory,
    zipName: String,
    overwrite: Boolean
  ): FileSystemFile {
    val destinationDir = destination.file
    val existing = findChild(destinationDir, zipName)

    if (existing != null) {
      if (!overwrite) {
        throw DestinationAlreadyExistsException()
      }
      if (!existing.deleteRecursively()) {
        throw UnableToZipException("failed to overwrite destination '${existing.uri}'")
      }
    }

    return if (destinationDir.uri.isContentUri) {
      val created = destinationDir.createFile("application/zip", zipName)
        ?: throw UnableToZipException("failed to create destination '$zipName'")
      FileSystemFile(created.uri).withRuntimeContextFrom(destination)
    } else {
      val directoryFile = File(destinationDir.uri.path!!)
      if (!directoryFile.exists()) {
        directoryFile.mkdirs()
      }
      FileSystemFile(Uri.fromFile(File(directoryFile, zipName))).withRuntimeContextFrom(destination)
    }
  }

  private fun prepareZipFileDestination(
    destination: FileSystemFile,
    overwrite: Boolean
  ): FileSystemFile {
    if (!destination.uri.isContentUri) {
      val destinationFile = File(destination.file.uri.path!!)
      if (destinationFile.exists()) {
        if (!overwrite) {
          throw DestinationAlreadyExistsException()
        }
        if (!destinationFile.delete()) {
          throw UnableToZipException("failed to overwrite destination '${destination.file.uri}'")
        }
      }
      destinationFile.parentFile?.mkdirs()
      return destination
    }

    if (!destination.file.exists()) {
      throw UnableToZipException("destination file does not exist: ${destination.file.uri}")
    }
    if (!overwrite) {
      throw DestinationAlreadyExistsException()
    }
    return destination
  }

  private fun resolveUnzipDestination(
    destination: FileSystemDirectory,
    source: FileSystemFile,
    options: UnzipOptions
  ): FileSystemDirectory {
    if (!destination.uri.isContentUri) {
      var destDir = File(destination.file.uri.path!!)

      if (options.createContainingDirectory) {
        val archiveName = source.file.fileName?.removeSuffix(".zip") ?: "archive"
        destDir = File(destDir, archiveName)
      }

      if (!destDir.exists()) {
        destDir.mkdirs()
      }

      return FileSystemDirectory(Uri.fromFile(destDir)).withRuntimeContextFrom(destination)
    }

    if (!destination.file.exists()) {
      throw UnableToUnzipException("destination directory does not exist: ${destination.file.uri}")
    }
    if (!options.createContainingDirectory) {
      return destination
    }

    val archiveName = source.file.fileName?.removeSuffix(".zip") ?: "archive"
    val containingDirectory = ensureDirectory(destination.file, archiveName, options.overwrite)
    return FileSystemDirectory(containingDirectory.uri).withRuntimeContextFrom(destination)
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

  private fun normalizeEntryPath(entryName: String): List<String> {
    val normalized = entryName.replace('\\', '/')
    val segments = normalized.split('/').filter { it.isNotEmpty() }

    if (normalized.startsWith("/") ||
      segments.any { it == "." || it == ".." } ||
      (segments.firstOrNull()?.contains(':') == true)
    ) {
      throw UnableToUnzipException("entry '$entryName' is outside of the target directory (zip slip)")
    }

    return segments
  }

  private fun ensureDirectoryAtPath(
    root: UnifiedFileInterface,
    pathSegments: List<String>,
    overwrite: Boolean
  ): UnifiedFileInterface {
    var current = root

    for (segment in pathSegments) {
      current = ensureDirectory(current, segment, overwrite)
    }

    return current
  }

  private fun ensureDirectory(
    parent: UnifiedFileInterface,
    name: String,
    overwrite: Boolean
  ): UnifiedFileInterface {
    val existing = findChild(parent, name)
    if (existing != null) {
      if (existing.isDirectory()) {
        return existing
      }
      if (!overwrite) {
        throw UnableToUnzipException("entry path '$name' conflicts with an existing file")
      }
      if (!existing.deleteRecursively()) {
        throw UnableToUnzipException("failed to overwrite existing file at '${existing.uri}'")
      }
    }

    return parent.createDirectory(name)
      ?: throw UnableToUnzipException("failed to create directory '$name'")
  }

  private fun resolveFileTarget(
    parent: UnifiedFileInterface,
    name: String,
    overwrite: Boolean
  ): UnifiedFileInterface {
    val existing = findChild(parent, name)
    if (existing != null) {
      if (existing.isDirectory()) {
        if (!overwrite) {
          throw UnableToUnzipException("entry path '$name' conflicts with an existing directory")
        }
        if (!existing.deleteRecursively()) {
          throw UnableToUnzipException("failed to overwrite existing directory at '${existing.uri}'")
        }
      } else {
        if (!overwrite) {
          throw UnableToUnzipException("entry path '$name' conflicts with an existing file")
        }
        return existing
      }
    }

    val created = parent.createFile("application/octet-stream", name)
      ?: throw UnableToUnzipException("failed to create file '$name'")
    return created
  }

  private fun findChild(parent: UnifiedFileInterface, name: String): UnifiedFileInterface? {
    return parent.listFilesAsUnified().firstOrNull { it.fileName == name }
  }

  private fun validateZipSignature(input: BufferedInputStream, source: UnifiedFileInterface) {
    input.mark(4)
    val signature = ByteArray(4)
    val bytesRead = input.read(signature)
    input.reset()

    if (bytesRead < 4 || signature[0] != 'P'.code.toByte() || signature[1] != 'K'.code.toByte()) {
      throw UnableToUnzipException("failed to open archive at ${source.uri.path ?: source.uri}")
    }
  }
}
