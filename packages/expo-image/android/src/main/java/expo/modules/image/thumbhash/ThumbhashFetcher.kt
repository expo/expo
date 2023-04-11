package expo.modules.image.thumbhash

import android.graphics.Bitmap
import android.util.Base64
import com.bumptech.glide.Priority
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.data.DataFetcher
import expo.modules.kotlin.exception.CodedException

class ThumbhashDecodingFailure(thumbhash: String?, cause: Exception?) : CodedException(
  message = "Cannot decode provided thumbhash '$thumbhash' $cause"
)

class ThumbhashFetcher(
  private val thumbhash: String?
) : DataFetcher<Bitmap> {
  override fun cleanup() = Unit
  override fun cancel() = Unit
  override fun getDataClass(): Class<Bitmap> = Bitmap::class.java
  override fun getDataSource(): DataSource = DataSource.LOCAL

  override fun loadData(priority: Priority, callback: DataFetcher.DataCallback<in Bitmap>) {
    try {
      val decodedThumbhash = Base64.decode(thumbhash, Base64.DEFAULT)
      val bitmap = ThumbhashDecoder.thumbHashToBitmap(decodedThumbhash)
      callback.onDataReady(bitmap)
    } catch (e: Exception) {
      callback.onLoadFailed(ThumbhashDecodingFailure(thumbhash, e))
    }
  }
}
