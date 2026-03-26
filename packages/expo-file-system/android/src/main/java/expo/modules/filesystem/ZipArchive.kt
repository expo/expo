package expo.modules.filesystem

import android.net.Uri
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.zip.ZipFile as JavaZipFile
import java.util.zip.ZipEntry as JavaZipEntry

private const val BUFFER_SIZE = 64 * 1024

internal class ZipArchive(private val sourceFile: FileSystemFile) : SharedObject() {
  private var zipFile: JavaZipFile? = null

  private fun getZipFile(): JavaZipFile {
    return zipFile ?: run {
      val path = sourceFile.file.uri.path
        ?: throw UnableToUnzipException("cannot resolve path for ${sourceFile.file.uri}")
      JavaZipFile(path).also { zipFile = it }
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

    destFile.parentFile?.mkdirs()

    zip.getInputStream(entry).use { input ->
      BufferedOutputStream(FileOutputStream(destFile), BUFFER_SIZE).use { output ->
        input.copyTo(output, BUFFER_SIZE)
      }
    }

    return FileSystemFile(Uri.fromFile(destFile))
  }

  fun asFile(): FileSystemFile {
    return sourceFile
  }

  fun close() {
    zipFile?.close()
    zipFile = null
  }

  private fun resolveEntryDestination(destination: FileSystemPath, entryName: String): File {
    return if (destination is FileSystemDirectory) {
      val fileName = entryName.split("/").last()
      File(destination.file.uri.path!!, fileName)
    } else {
      File(destination.file.uri.path!!)
    }
  }
}
