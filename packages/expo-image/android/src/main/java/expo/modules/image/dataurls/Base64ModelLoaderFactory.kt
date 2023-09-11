package expo.modules.image.dataurls

import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory
import java.nio.ByteBuffer

class Base64ModelLoaderFactory : ModelLoaderFactory<String, ByteBuffer> {
  override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<String, ByteBuffer> =
    Base64ModelLoader()
  override fun teardown() = Unit
}
