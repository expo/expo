package expo.modules.image.blurhash

import android.graphics.Bitmap
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory

class BlurhashModelLoaderFactory : ModelLoaderFactory<BlurhashModel, Bitmap> {
  override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<BlurhashModel, Bitmap> =
    BlurhashModelLoader()

  override fun teardown() = Unit
}
