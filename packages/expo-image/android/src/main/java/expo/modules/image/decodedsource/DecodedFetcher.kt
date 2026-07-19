package expo.modules.image.decodedsource

import android.graphics.drawable.Drawable
import com.bumptech.glide.Priority
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.data.DataFetcher

class DecodedFetcher(
  private val drawable: Drawable
) : DataFetcher<Drawable> {
  override fun cleanup() = Unit
  override fun cancel() = Unit
  override fun getDataClass(): Class<Drawable> = Drawable::class.java
  override fun getDataSource(): DataSource = DataSource.LOCAL

  override fun loadData(priority: Priority, callback: DataFetcher.DataCallback<in Drawable>) {
    callback.onDataReady(drawable)
  }
}
