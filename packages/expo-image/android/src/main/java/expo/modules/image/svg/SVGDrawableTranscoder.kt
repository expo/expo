package expo.modules.image.svg

import android.content.Context
import android.graphics.Picture
import android.graphics.drawable.Drawable
import android.graphics.drawable.PictureDrawable
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.resource.SimpleResource
import com.bumptech.glide.load.resource.transcode.ResourceTranscoder
import com.caverock.androidsvg.SVG
import com.caverock.androidsvg.applyTintColor
import expo.modules.image.CustomOptions

/**
 * We have to use the intrinsicWidth/Height from the Picture to render the image at a high enough resolution, but at the same time we want to return the actual
 * preferred width and height of the SVG to JS. This class allows us to do that.
 */
class SVGPictureDrawable(picture: Picture, val svgIntrinsicWidth: Int, val svgIntrinsicHeight: Int) : PictureDrawable(picture)

/**
 * Convert the [SVG]'s internal representation to an Android-compatible one ([Picture]).
 *
 * Copied from https://github.com/bumptech/glide/blob/10acc31a16b4c1b5684f69e8de3117371dfa77a8/samples/svg/src/main/java/com/bumptech/glide/samples/svg/SvgDrawableTranscoder.java
 * and rewritten to Kotlin.
 */
class SVGDrawableTranscoder(val context: Context) : ResourceTranscoder<SVG?, Drawable> {
  override fun transcode(toTranscode: Resource<SVG?>, options: Options): Resource<Drawable> {
    val svgData = toTranscode.get()
    val intrinsicWidth = svgData.documentViewBox.width().toInt()
    val intrinsicHeight = svgData.documentViewBox.height().toInt()

    val tintColor = options.get(CustomOptions.tintColor)
    if (tintColor != null) {
      applyTintColor(svgData, tintColor)
    }

    val picture = SVGPictureDrawable(
      svgData.renderToPicture(),
      intrinsicWidth,
      intrinsicHeight
    )
    return SimpleResource(
      picture
    )
  }
}
