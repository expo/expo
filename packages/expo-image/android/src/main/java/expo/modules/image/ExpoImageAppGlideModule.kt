package expo.modules.image

import android.content.Context
import android.util.Log
import com.bumptech.glide.Glide
import com.bumptech.glide.GlideBuilder
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.load.engine.cache.InternalCacheDiskCacheFactory
import com.bumptech.glide.load.resource.gif.ByteBufferGifDecoder
import com.bumptech.glide.load.resource.gif.GifDrawable
import com.bumptech.glide.load.resource.gif.StreamGifDecoder
import com.bumptech.glide.module.AppGlideModule
import com.bumptech.glide.request.RequestOptions
import com.github.penfeizhou.animation.decode.FrameSeqDecoder
import com.github.penfeizhou.animation.glide.AnimationDecoderOption
import com.github.penfeizhou.animation.glide.ByteBufferAnimationDecoder
import com.github.penfeizhou.animation.glide.StreamAnimationDecoder
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

    builder.setDiskCache(
      ExpoImageDiskCache.Factory(InternalCacheDiskCacheFactory(context))
    )

    builder.setLogLevel(
      if (BuildConfig.ALLOW_GLIDE_LOGS) {
        Log.VERBOSE
      } else {
        Log.ERROR
      }
    )

    // APNG4Android's AVIF decoder claims still AVIFs too. Only animated ones go through it, with the
    // decoders registered in `registerComponents`.
    builder.setDefaultRequestOptions(
      RequestOptions().set(AnimationDecoderOption.DISABLE_ANIMATION_AVIF_DECODER, true)
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

    // Still AVIFs fall through to Glide's avif-integration, see `AnimatedAvifDecoders.kt`.
    val animationDecoder = ByteBufferAnimationDecoder()
    registry.prepend(
      InputStream::class.java,
      FrameSeqDecoder::class.java,
      AnimatedAvifStreamDecoder(parsers, glide.arrayPool, StreamAnimationDecoder(animationDecoder))
    )
    registry.prepend(
      ByteBuffer::class.java,
      FrameSeqDecoder::class.java,
      AnimatedAvifByteBufferDecoder(parsers, animationDecoder)
    )
  }
}
