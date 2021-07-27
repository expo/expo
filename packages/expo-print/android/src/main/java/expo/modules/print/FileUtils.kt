// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.print

import android.content.Context
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintDocumentAdapter
import android.util.Base64
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.RandomAccessFile
import java.util.*

object FileUtils {
  // http://stackoverflow.com/a/38858040/1771921
  fun uriFromFile(file: File?): Uri {
    return Uri.fromFile(file)
  }

  @Throws(IOException::class)
  fun ensureDirExists(dir: File): File {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw IOException("Couldn't create directory '$dir'")
    }
    return dir
  }

  @Throws(IOException::class)
  fun generateOutputPath(internalDirectory: File, dirName: String, extension: String): String {
    val directory = File(internalDirectory.toString() + File.separator + dirName)
    ensureDirExists(directory)
    val filename = UUID.randomUUID().toString()
    return directory.toString() + File.separator + filename + extension
  }

  @Throws(IOException::class)
  fun copyToOutputStream(destination: ParcelFileDescriptor, callback: PrintDocumentAdapter.WriteResultCallback, input: InputStream) {
    FileOutputStream(destination.fileDescriptor).use { fileOut ->
      input.copyTo(fileOut)
    }
    callback.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
  }

  fun decodeDataURI(uri: String): InputStream {
    val base64Index = uri.indexOf(";base64,")
    val plainBase64 = uri.substring(base64Index + 8)
    val byteArray = Base64.decode(plainBase64, Base64.DEFAULT)
    return ByteArrayInputStream(byteArray)
  }

  @Throws(IOException::class)
  fun generateFilePath(context: Context): String {
    return generateOutputPath(context.cacheDir, "Print", ".pdf")
  }

  @Throws(IOException::class)
  fun encodeFromFile(file: File): String {
    val randomAccessFile = RandomAccessFile(file, "r")
    val fileBytes = ByteArray(randomAccessFile.length().toInt())
    randomAccessFile.readFully(fileBytes)
    return Base64.encodeToString(fileBytes, Base64.NO_WRAP)
  }
}
