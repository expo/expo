package expo.modules.image.blurhash

import android.graphics.Bitmap
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory
import expo.modules.image.BlurhashModelProvider

class BlurhashModelLoaderFactory : ModelLoaderFactory<BlurhashModelProvider, Bitmap> {
  override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<BlurhashModelProvider, Bitmap> =
    BlurhashModelLoader()

  override fun teardown() = Unit
}
