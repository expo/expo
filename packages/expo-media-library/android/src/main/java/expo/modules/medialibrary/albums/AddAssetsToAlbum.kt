package expo.modules.medialibrary.albums

import android.content.Context
import android.media.MediaScannerConnection
import android.os.Build
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.PermissionsException
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

suspend fun addAssetsToAlbum(
  context: Context,
  assetIds: Array<String>,
  albumId: String,
  copyToAlbum: Boolean
): Boolean = withContext(Dispatchers.IO) {
  val strategy = if (copyToAlbum) {
    AssetFileStrategy.copyStrategy
  } else {
    AssetFileStrategy.moveStrategy
  }

  val album = getAlbumFile(context, albumId)
  coroutineContext.ensureActive()

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !album.canWrite()) {
    throw PermissionsException(
      "The application doesn't have permission to write to the album's directory. For more information, check out https://expo.fyi/android-r."
    )
  }

  val assets = MediaLibraryUtils.getAssetsById(context, *assetIds)
  coroutineContext.ensureActive()

  val paths = assets.map { asset ->
    val newAsset = strategy.apply(asset, album, context)
    newAsset.path
  }
  coroutineContext.ensureActive()

  val result = CompletableDeferred<Boolean>()
  val atomicInteger = AtomicInteger(paths.size)
  MediaScannerConnection.scanFile(context, paths.toTypedArray(), null) { _, _ ->
    if (atomicInteger.decrementAndGet() == 0) {
      result.complete(true)
    }
  }
  return@withContext result.await()
}
