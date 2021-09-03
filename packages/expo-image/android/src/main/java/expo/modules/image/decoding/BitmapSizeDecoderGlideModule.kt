package expo.modules.image.decoding

import android.content.Context
import android.graphics.BitmapFactory
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.module.LibraryGlideModule
import expo.modules.image.ExpoImageSize
import expo.modules.image.transcoding.OptionsSizeResourceTranscoder
import java.io.File

@GlideModule
class BitmapSizeDecoderGlideModule : LibraryGlideModule() {
  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    registry.prepend(File::class.java, BitmapFactory.Options::class.java, BitmapSizeDecoder())
    registry.register(BitmapFactory.Options::class.java, ExpoImageSize::class.java, OptionsSizeResourceTranscoder())
  }
}
