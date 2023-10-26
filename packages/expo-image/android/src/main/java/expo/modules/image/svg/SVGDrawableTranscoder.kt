package expo.modules.image.svg

import android.content.Context
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Picture
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.PictureDrawable
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.resource.SimpleResource
import com.bumptech.glide.load.resource.transcode.ResourceTranscoder
import com.caverock.androidsvg.SVG

/**
* We have to use the intrinsicWidth/Height from the bitmap to render the image at a high enough resolution, but at the same time we want to return the actual
* preferred width and height of the SVG to JS. This class allows us to do that.
*/
class SVGBitmapDrawable(res: Resources?, bitmap: Bitmap?, val svgIntrinsicWidth: Int, val svgIntrinsicHeight: Int) : BitmapDrawable(res, bitmap)

/**
 * Convert the [SVG]'s internal representation to an Android-compatible one ([Picture]).
 *
 * Copied from https://github.com/bumptech/glide/blob/10acc31a16b4c1b5684f69e8de3117371dfa77a8/samples/svg/src/main/java/com/bumptech/glide/samples/svg/SvgDrawableTranscoder.java
 * and rewritten to Kotlin.
 */
class SVGDrawableTranscoder(val context: Context) : ResourceTranscoder<SVG?, Drawable> {
  override fun transcode(toTranscode: Resource<SVG?>, options: Options): Resource<Drawable> {
    val picture = toTranscode.get().renderToPicture()
    val drawable = PictureDrawable(picture)
    val width = drawable.intrinsicWidth
    val height = drawable.intrinsicHeight
    val svgIntrinsicWidth = toTranscode.get().documentViewBox.width().toInt()
    val svgIntrinsicHeight = toTranscode.get().documentViewBox.height().toInt()

    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, canvas.width, canvas.height)
    drawable.draw(canvas)

    return SimpleResource(SVGBitmapDrawable(context.resources, bitmap, svgIntrinsicWidth, svgIntrinsicHeight))
  }
}
