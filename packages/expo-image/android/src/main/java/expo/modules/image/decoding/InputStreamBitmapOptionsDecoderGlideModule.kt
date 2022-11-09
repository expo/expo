package expo.modules.image.decoding

import android.content.Context
import android.graphics.BitmapFactory
import com.bumptech.glide.Glide
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.module.LibraryGlideModule
import java.io.InputStream

@GlideModule
class InputStreamBitmapOptionsDecoderGlideModule : LibraryGlideModule() {
  override fun registerComponents(
    context: Context,
    glide: Glide,
    registry: Registry
  ) {
    registry.append(
      InputStream::class.java,
      BitmapFactory.Options::class.java,
      InputStreamBitmapFactoryOptionsDecoder()
    )
  }
}
