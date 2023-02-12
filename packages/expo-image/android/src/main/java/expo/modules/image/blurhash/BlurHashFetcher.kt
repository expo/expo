package expo.modules.image.blurhash

import android.graphics.Bitmap
import com.bumptech.glide.Priority
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.data.DataFetcher
import expo.modules.kotlin.exception.CodedException

class BlurhashDecodingFailure(blurHash: String?) : CodedException(
  message = "Cannot decode provided blurhash '$blurHash'"
)

class BlurHashFetcher(
  private val blurHash: String?,
  private val width: Int,
  private val height: Int,
  private val punch: Float
) : DataFetcher<Bitmap> {
  override fun cleanup() = Unit
  override fun cancel() = Unit
  override fun getDataClass(): Class<Bitmap> = Bitmap::class.java
  override fun getDataSource(): DataSource = DataSource.LOCAL

  override fun loadData(priority: Priority, callback: DataFetcher.DataCallback<in Bitmap>) {
    val bitmap = BlurhashDecoder.decode(blurHash, width, height, punch)
    if (bitmap == null) {
      callback.onLoadFailed(BlurhashDecodingFailure(blurHash))
      return
    }
    callback.onDataReady(bitmap)
  }
}
