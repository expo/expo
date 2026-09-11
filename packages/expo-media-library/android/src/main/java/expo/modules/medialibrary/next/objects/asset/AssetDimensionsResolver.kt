package expo.modules.medialibrary.next.objects.asset

import android.graphics.BitmapFactory
import expo.modules.medialibrary.next.objects.asset.domain.AssetMediaStoreItem
import expo.modules.medialibrary.next.objects.asset.domain.MediaStoreImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AssetDimensionsResolver {
  suspend fun resolveDimensions(mediaStoreItem: AssetMediaStoreItem): AssetMediaStoreItem =
    when (mediaStoreItem) {
      is AssetMediaStoreItem.Image ->
        AssetMediaStoreItem.Image(resolveImageDimensions(mediaStoreItem.asset))
      is AssetMediaStoreItem.Video,
      is AssetMediaStoreItem.Audio -> mediaStoreItem
    }

  private suspend fun resolveImageDimensions(image: MediaStoreImage): MediaStoreImage {
    val width = image.width?.takeIf { it > 0 }
    val height = image.height?.takeIf { it > 0 }
    if (width != null && height != null) {
      return image
    }
    val path = image.data ?: return image
    return withContext(Dispatchers.IO) {
      val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeFile(path, options)
      image.copy(
        width = width ?: options.outWidth,
        height = height ?: options.outHeight
      )
    }
  }
}
