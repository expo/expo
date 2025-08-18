package expo.modules.medialibrary.albums.migration

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MediaLibraryUtils.AssetFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

@RequiresApi(Build.VERSION_CODES.R)
suspend fun migrateAlbum(
  context: Context,
  assetFiles: List<AssetFile>,
  albumDirName: String
) = withContext(Dispatchers.IO) {
  // Previously, users were able to save different assets type in the same directory.
  // But now, it's not always possible.
  // If album contains movies or pictures, we can move it to Environment.DIRECTORY_PICTURES.
  // Otherwise, we reject.
  val assetsRelativePaths = assetFiles
    .map { MediaLibraryUtils.getRelativePathForAssetType(it.mimeType, false) }
    .toSet()
  if (assetsRelativePaths.size > 1) {
    throw AlbumException("The album contains incompatible file types.")
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
}
