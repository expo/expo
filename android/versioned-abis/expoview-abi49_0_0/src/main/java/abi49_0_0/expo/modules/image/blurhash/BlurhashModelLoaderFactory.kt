package abi49_0_0.expo.modules.image.blurhash

import android.graphics.Bitmap
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.load.model.ModelLoaderFactory
import com.bumptech.glide.load.model.MultiModelLoaderFactory
import abi49_0_0.expo.modules.image.GlideBlurhashModel

class BlurhashModelLoaderFactory : ModelLoaderFactory<GlideBlurhashModel, Bitmap> {
  override fun build(multiFactory: MultiModelLoaderFactory): ModelLoader<GlideBlurhashModel, Bitmap> =
    BlurhashModelLoader()

  override fun teardown() = Unit
}
