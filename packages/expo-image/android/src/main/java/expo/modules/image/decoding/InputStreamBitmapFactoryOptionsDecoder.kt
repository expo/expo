package expo.modules.image.decoding

import android.graphics.BitmapFactory
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.resource.SimpleResource
import java.io.IOException
import java.io.InputStream

class InputStreamBitmapFactoryOptionsDecoder : ResourceDecoder<InputStream, BitmapFactory.Options> {
  override fun handles(source: InputStream, options: Options) = true

  @Throws(IOException::class)
  override fun decode(
    source: InputStream,
    width: Int,
    height: Int,
    glideOptions: Options
  ): Resource<BitmapFactory.Options> {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeStream(source, null, options)
    return SimpleResource(options)
  }
}
