package expo.modules.medialibrary.albums.migration

import expo.modules.medialibrary.MediaLibraryUtils.AssetFile
import android.os.AsyncTask
import android.content.ContentValues
import android.provider.MediaStore
import android.content.ContentUris
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.core.Promise
import expo.modules.medialibrary.ERROR_UNABLE_TO_MIGRATE
import expo.modules.medialibrary.MediaLibraryUtils
import java.io.File

@RequiresApi(Build.VERSION_CODES.R)
internal class MigrateAlbum(
  private val context: Context,
  private val assetFiles: List<AssetFile>,
  private val albumDirName: String,
  private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  override fun doInBackground(vararg voids: Void?): Void? {
    // Previously, users were able to save different assets type in the same directory.
    // But now, it's not always possible.
    // If album contains movies or pictures, we can move it to Environment.DIRECTORY_PICTURES.
    // Otherwise, we reject.
    val assetsRelativePaths = assetFiles
      .map { MediaLibraryUtils.getRelativePathForAssetType(it.mimeType, false) }
      .toSet()
    if (assetsRelativePaths.size > 1) {
      promise.reject(ERROR_UNABLE_TO_MIGRATE, "The album contains incompatible file types.")
      return null
    }

    val relativePath = assetsRelativePaths.iterator().next() + File.separator + albumDirName
    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath)
    }
    assetFiles.forEach { assetFile ->
      context
        .contentResolver
        .update(
          ContentUris.withAppendedId(
            MediaLibraryUtils.mimeTypeToExternalUri(assetFile.mimeType),
            assetFile.assetId.toLong()
          ),
          values,
          null
        )
    }
    promise.resolve(null)
    return null
  }
}
