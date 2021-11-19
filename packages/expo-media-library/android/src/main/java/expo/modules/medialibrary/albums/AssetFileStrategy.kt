package expo.modules.medialibrary.albums

import android.content.ContentUris
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.MediaLibraryUtils
import java.io.File
import java.io.IOException

internal fun interface AssetFileStrategy {
  @Throws(IOException::class)
  fun apply(src: File, dir: File, context: Context): File

  companion object {
    val copyStrategy = AssetFileStrategy { src, dir, _ -> MediaLibraryUtils.safeCopyFile(src, dir) }
    val moveStrategy = AssetFileStrategy strategy@{ src, dir, context ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && src is MediaLibraryUtils.AssetFile) {
        val assetId = src.assetId
        val assetUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, assetId.toLong())
        val newFile = MediaLibraryUtils.safeCopyFile(src, dir)
        context.contentResolver.delete(assetUri, null)
        return@strategy newFile
      }
      val newFile = MediaLibraryUtils.safeMoveFile(src, dir)
      context.contentResolver.delete(
        EXTERNAL_CONTENT_URI,
        "${MediaStore.MediaColumns.DATA}=?", arrayOf(src.path)
      )
      newFile
    }
  }
}
