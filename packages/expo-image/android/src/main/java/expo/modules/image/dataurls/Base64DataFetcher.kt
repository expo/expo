package expo.modules.image.dataurls

import android.util.Base64
import com.bumptech.glide.Priority
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.data.DataFetcher
import java.nio.ByteBuffer

class Base64DataFetcher(private val data: String) : DataFetcher<ByteBuffer> {
  override fun cleanup() = Unit
  override fun cancel() = Unit
  override fun getDataClass(): Class<ByteBuffer> = ByteBuffer::class.java
  override fun getDataSource(): DataSource = DataSource.LOCAL

  override fun loadData(priority: Priority, callback: DataFetcher.DataCallback<in ByteBuffer>) {
    val base64Section = getBase64Section()
    val data = Base64.decode(base64Section, Base64.DEFAULT)
    val byteBuffer = ByteBuffer.wrap(data)
    callback.onDataReady(byteBuffer)
  }

  private fun getBase64Section(): String {
    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs.
    val startOfBase64Section = data.indexOf(',')
    return data.substring(startOfBase64Section + 1)
  }
}
