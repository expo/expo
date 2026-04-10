package expo.modules.medialibrary.next.observers

import android.content.ContentResolver
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import kotlinx.coroutines.CoroutineScope

class MediaStoreObserverManager(
  private val contentResolver: ContentResolver,
  private val observerScope: CoroutineScope,
  private val onChange: OnMediaLibraryChange
) {
  private var imagesObserver: MediaStoreContentObserver? = null
  private var videosObserver: MediaStoreContentObserver? = null

  fun startObserving() {
    if (imagesObserver != null || videosObserver != null) {
      return
    }

    val handler = Handler(Looper.getMainLooper())

    imagesObserver = MediaStoreContentObserver(
      handler = handler,
      mediaType = MediaType.IMAGE,
      onChange = onChange,
      observerScope = observerScope,
      contentResolver = contentResolver
    ).also { imagesObserver ->
      contentResolver.registerContentObserver(
        MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
        true,
        imagesObserver
      )
    }

    videosObserver = MediaStoreContentObserver(
      handler = handler,
      mediaType = MediaType.VIDEO,
      onChange = onChange,
      observerScope = observerScope,
      contentResolver = contentResolver
    ).also { videosObserver ->
      contentResolver.registerContentObserver(
        MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
        true,
        videosObserver
      )
    }
  }

  fun stopObserving() {
    imagesObserver?.let {
      contentResolver.unregisterContentObserver(it)
      imagesObserver = null
    }
    videosObserver?.let {
      contentResolver.unregisterContentObserver(it)
      videosObserver = null
    }
  }
}
