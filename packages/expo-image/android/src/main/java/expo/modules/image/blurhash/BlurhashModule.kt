package expo.modules.image.blurhash

import android.content.Context
import android.graphics.Bitmap
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.module.LibraryGlideModule
import expo.modules.image.BlurhashModelProvider

@GlideModule
class BlurhashModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    super.registerComponents(context, glide, registry)
    registry.prepend(BlurhashModelProvider::class.java, Bitmap::class.java, BlurhashModelLoaderFactory())
  }
}
