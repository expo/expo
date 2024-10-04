package expo.modules.image.thumbhash

import android.content.Context
import android.graphics.Bitmap
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.module.LibraryGlideModule
import expo.modules.image.GlideThumbhashModel

@GlideModule
class ThumbhashModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    super.registerComponents(context, glide, registry)
    registry.prepend(GlideThumbhashModel::class.java, Bitmap::class.java, ThumbhashModelLoaderFactory())
  }
}
