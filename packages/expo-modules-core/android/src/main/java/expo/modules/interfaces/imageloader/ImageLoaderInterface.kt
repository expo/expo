package expo.modules.interfaces.imageloader

import android.graphics.Bitmap
import expo.modules.kotlin.services.Service
import java.util.concurrent.Future

interface ImageLoaderInterface : Service {
  companion object {
    /**
     * Indicates that the image should keep its original size on the given axis.
     * Matches the value of Glide's `Target.SIZE_ORIGINAL`.
     */
    const val SIZE_ORIGINAL = Int.MIN_VALUE
  }

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

  /**
   * Loads image with no caching, decoded to fit within `maxWidth`×`maxHeight` while preserving
   * the aspect ratio, so that large images don't need to be fully decoded into memory.
   * Implementations that don't support bounded decoding fall back to the full-sized image.
   */
  fun loadImageForManipulationFromURL(url: String, maxWidth: Int, maxHeight: Int, resultListener: ResultListener) =
    loadImageForManipulationFromURL(url, resultListener)
}
