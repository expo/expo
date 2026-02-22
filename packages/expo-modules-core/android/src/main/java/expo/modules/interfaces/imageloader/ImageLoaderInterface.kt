package expo.modules.interfaces.imageloader

import android.graphics.Bitmap
import expo.modules.kotlin.services.Service
import java.util.concurrent.Future

interface ImageLoaderInterface : Service {
  interface ResultListener {
    fun onSuccess(bitmap: Bitmap)

    fun onFailure(cause: Throwable?)
  }

  /**
   * Loads image into memory that might be cached and downsampled if necessary.
   */
  fun loadImageForDisplayFromURL(url: String): Future<Bitmap>

  /**
   * Loads image into memory that might be cached and downsampled if necessary.
   */
  fun loadImageForDisplayFromURL(url: String, resultListener: ResultListener)

  /**
   * Loads full-sized image with no caching.
   */
  fun loadImageForManipulationFromURL(url: String): Future<Bitmap>

  /**
   * Loads full-sized image with no caching.
   */
  fun loadImageForManipulationFromURL(url: String, resultListener: ResultListener)
}
