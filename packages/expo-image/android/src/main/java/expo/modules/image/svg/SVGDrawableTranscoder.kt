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
import com.caverock.androidsvg.PreserveAspectRatio
import com.caverock.androidsvg.RenderOptions
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
    val svgData = toTranscode.get()
    val svgIntrinsicWidth = svgData.documentViewBox.width()
    val svgIntrinsicHeight = svgData.documentViewBox.height()
    val documentWidth = svgData.documentWidth
    val documentHeight = svgData.documentHeight
    val aspectRatio = svgIntrinsicWidth / svgIntrinsicHeight

    // We have no information on what content fit the user wants, so when choosing render resolution we assume
    // "cover" in order to prevent loss of quality after the bitmap is transformed to appropriate `contentFit` later.
    val shouldUseHeightReference = documentWidth / aspectRatio > documentHeight
    val renderWidth = if (shouldUseHeightReference) documentWidth else documentHeight * aspectRatio
    val renderHeight = if (shouldUseHeightReference) documentWidth / aspectRatio else documentHeight
    val renderOptions = RenderOptions().apply {
      viewPort(0f, 0f, renderWidth, renderHeight)
      preserveAspectRatio(PreserveAspectRatio.FULLSCREEN_START)
    }

    val picture = svgData.renderToPicture(renderWidth.toInt(), renderHeight.toInt(), renderOptions)
    val drawable = PictureDrawable(picture)
    val bitmap = Bitmap.createBitmap(renderWidth.toInt(), renderHeight.toInt(), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, canvas.width, canvas.height)
    drawable.draw(canvas)

    return SimpleResource(SVGBitmapDrawable(context.resources, bitmap, svgIntrinsicWidth.toInt(), svgIntrinsicHeight.toInt()))
  }
}
