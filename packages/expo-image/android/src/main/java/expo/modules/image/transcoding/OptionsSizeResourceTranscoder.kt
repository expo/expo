package expo.modules.image.transcoding

import android.graphics.BitmapFactory

import com.bumptech.glide.load.Options
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.resource.SimpleResource
import com.bumptech.glide.load.resource.transcode.ResourceTranscoder

import expo.modules.image.ExpoImageSize

class OptionsSizeResourceTranscoder : ResourceTranscoder<BitmapFactory.Options, ExpoImageSize> {
  override fun transcode(resource: Resource<BitmapFactory.Options>, options: Options): Resource<ExpoImageSize> {
    val bitmapOptions = resource.get()
    return SimpleResource(ExpoImageSize(bitmapOptions.outWidth, bitmapOptions.outHeight))
  }
}
