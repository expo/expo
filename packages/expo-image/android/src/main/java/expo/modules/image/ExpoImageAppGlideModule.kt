package expo.modules.image

import android.content.Context
import android.util.Log
import com.bumptech.glide.Glide
import com.bumptech.glide.GlideBuilder
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.load.resource.gif.ByteBufferGifDecoder
import com.bumptech.glide.load.resource.gif.GifDrawable
import com.bumptech.glide.load.resource.gif.StreamGifDecoder
import com.bumptech.glide.module.AppGlideModule
import java.io.InputStream
import java.nio.ByteBuffer

/**
 * We need to include an [AppGlideModule] for [GlideModule] annotations
 * to work.
 */
@GlideModule
class ExpoImageAppGlideModule : AppGlideModule() {
  override fun applyOptions(context: Context, builder: GlideBuilder) {
    super.applyOptions(context, builder)

    builder.setLogLevel(
      if (BuildConfig.ALLOW_GLIDE_LOGS) {
        Log.VERBOSE
      } else {
        Log.ERROR
      }
    )
  }

  override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
    super.registerComponents(context, glide, registry)

    // APNG4Android's GIF decoder can crash on small interlaced frames. Prepending
    // Glide's decoders keeps GIFs animated without routing them through that decoder.
    val parsers = registry.imageHeaderParsers
    val byteBufferDecoder = ByteBufferGifDecoder(context, parsers, glide.bitmapPool, glide.arrayPool)
    val streamDecoder = StreamGifDecoder(parsers, byteBufferDecoder, glide.arrayPool)

    registry.prepend(InputStream::class.java, GifDrawable::class.java, streamDecoder)
    registry.prepend(ByteBuffer::class.java, GifDrawable::class.java, byteBufferDecoder)
  }
}
