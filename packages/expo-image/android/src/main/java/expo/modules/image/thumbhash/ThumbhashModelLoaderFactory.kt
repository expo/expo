package expo.modules.image.thumbhash

import android.graphics.Bitmap
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory
import expo.modules.image.ThumbhashModelProvider

class ThumbhashModelLoaderFactory : ModelLoaderFactory<ThumbhashModelProvider, Bitmap> {
  override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<ThumbhashModelProvider, Bitmap> =
    ThumbhashModelLoader()

  override fun teardown() = Unit
}
