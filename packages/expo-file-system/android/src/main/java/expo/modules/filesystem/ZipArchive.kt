package expo.modules.filesystem

import android.net.Uri
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.BufferedOutputStream
import java.io.File
import java.util.zip.ZipFile as JavaZipFile
import java.util.zip.ZipEntry as JavaZipEntry

private const val BUFFER_SIZE = 64 * 1024

internal class ZipArchive(private val sourceFile: FileSystemFile) : SharedObject() {
  private var zipFile: JavaZipFile? = null
  private var temporaryArchiveFile: File? = null

  private fun getZipFile(): JavaZipFile {
    return zipFile ?: run {
      JavaZipFile(resolveArchivePath()).also { zipFile = it }
    }
  }

  fun list(): List<ZipEntryRecord> {
    val zip = getZipFile()
    return zip.entries().asSequence().map { entry ->
      ZipEntryRecord(
        name = entry.name,
        isDirectory = entry.isDirectory,
        size = entry.size,
        compressedSize = entry.compressedSize,
        crc32 = entry.crc,
        lastModified = entry.time,
        compressionMethod = when (entry.method) {
          JavaZipEntry.DEFLATED -> "deflate"
          JavaZipEntry.STORED -> "none"
          else -> null
        }
      )
    }.toList()
  }

  fun extractEntry(
    entryName: String,
    destination: FileSystemPath
  ): FileSystemFile {
    val zip = getZipFile()
    val entry = zip.getEntry(entryName)
      ?: throw UnableToUnzipException("entry '$entryName' not found in archive")

    val destFile = resolveEntryDestination(destination, entry.name)

    zip.getInputStream(entry).use { input ->
      BufferedOutputStream(destFile.file.outputStream(append = false), BUFFER_SIZE).use { output ->
        input.copyTo(output, BUFFER_SIZE)
      }
    }

    return destFile
  }

  fun asFile(): FileSystemFile {
    return sourceFile
  }

  fun close() {
    zipFile?.close()
    zipFile = null
    temporaryArchiveFile?.delete()
    temporaryArchiveFile = null
  }

  private fun resolveArchivePath(): File {
    if (!sourceFile.uri.isContentUri) {
      val path = sourceFile.file.uri.path
        ?: throw UnableToUnzipException("cannot resolve path for ${sourceFile.file.uri}")
      return File(path)
    }

    return temporaryArchiveFile ?: run {
      val cacheDir = appContext?.reactContext?.cacheDir
        ?: throw MissingAppContextException()
      val tempFile = File.createTempFile("expo-fs-archive-", ".zip", cacheDir)
      sourceFile.file.inputStream().use { input ->
        tempFile.outputStream().use { output ->
          input.copyTo(output, BUFFER_SIZE)
        }
      }
      tempFile.also { temporaryArchiveFile = it }
    }
  }

  private fun resolveEntryDestination(
    destination: FileSystemPath,
    entryName: String
  ): FileSystemFile {
    return if (destination is FileSystemDirectory) {
      val fileName = entryName.split("/").last()
      if (destination.uri.isContentUri) {
        val existing = destination.file.listFilesAsUnified().firstOrNull { it.fileName == fileName }
        if (existing != null) {
          if (existing.isDirectory() && !existing.deleteRecursively()) {
            throw UnableToUnzipException("failed to overwrite destination '${existing.uri}'")
          }
          if (!existing.isDirectory()) {
            return FileSystemFile(existing.uri).withRuntimeContextFrom(destination)
          }
        }
        val created = destination.file.createFile("application/octet-stream", fileName)
          ?: throw UnableToUnzipException("failed to create destination '$fileName'")
        FileSystemFile(created.uri).withRuntimeContextFrom(destination)
      } else {
        val localFile = File(destination.file.uri.path!!, fileName)
        localFile.parentFile?.mkdirs()
        FileSystemFile(Uri.fromFile(localFile)).withRuntimeContextFrom(destination)
      }
    } else {
      if (!destination.uri.isContentUri) {
        val localFile = File(destination.file.uri.path!!)
        localFile.parentFile?.mkdirs()
      } else if (!destination.file.exists()) {
        throw UnableToUnzipException("destination file does not exist: ${destination.file.uri}")
      }
      destination as FileSystemFile
    }
  }
}
