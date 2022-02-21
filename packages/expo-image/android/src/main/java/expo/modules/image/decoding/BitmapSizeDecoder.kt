package expo.modules.image.decoding

import android.graphics.BitmapFactory

import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.resource.SimpleResource

import java.io.File
import java.io.IOException

class BitmapSizeDecoder : ResourceDecoder<File, BitmapFactory.Options> {
  @Throws(IOException::class)
  override fun handles(source: File, options: Options): Boolean = true

  override fun decode(source: File, width: Int, height: Int, options: Options): Resource<BitmapFactory.Options>? {
    val bitmapOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(source.absolutePath, bitmapOptions)
    return SimpleResource(bitmapOptions)
  }
}
