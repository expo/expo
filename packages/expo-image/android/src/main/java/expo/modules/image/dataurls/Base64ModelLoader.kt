package expo.modules.image.dataurls

import com.bumptech.glide.load.Options
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.signature.ObjectKey
import java.nio.ByteBuffer

/**
 * Loads an [java.io.InputStream] from a Base 64 encoded String.
 */
class Base64ModelLoader : ModelLoader<String, ByteBuffer> {
  override fun handles(model: String): Boolean {
    return model.startsWith("data:")
  }

  override fun buildLoadData(
    model: String,
    width: Int,
    height: Int,
    options: Options
  ): ModelLoader.LoadData<ByteBuffer> {
    return ModelLoader.LoadData(ObjectKey(model), Base64DataFetcher(model))
  }
}
