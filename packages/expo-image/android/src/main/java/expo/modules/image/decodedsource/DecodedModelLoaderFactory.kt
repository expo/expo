package expo.modules.image.decodedsource

import android.graphics.drawable.Drawable
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory

class DecodedModelLoaderFactory : ModelLoaderFactory<DecodedModel, Drawable> {
  override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<DecodedModel, Drawable> =
    DecodedModelLoader()

  override fun teardown() = Unit
}
