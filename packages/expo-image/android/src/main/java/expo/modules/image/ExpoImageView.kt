package expo.modules.image

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.PorterDuff
import android.graphics.RectF
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Log
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.graphics.transform
import androidx.core.view.isVisible
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import expo.modules.image.enums.ContentFit
import expo.modules.image.records.ContentPosition

@OptIn(UnstableReactNativeAPI::class)
@SuppressLint("ViewConstructor")
class ExpoImageView(
  context: Context
) : AppCompatImageView(context) {
  var currentTarget: ImageViewWrapperTarget? = null
  var isPlaceholder: Boolean = false

  fun recycleView(): ImageViewWrapperTarget? {
    setImageDrawable(null)

    val target = currentTarget?.apply {
      isUsed = false
    }

    currentTarget = null
    isVisible = false
    isPlaceholder = false

    return target
  }

  private var transformationMatrixChanged = false

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    applyTransformationMatrix()
  }

  fun applyTransformationMatrix() {
    if (drawable == null) {
      return
    }

    if (isPlaceholder) {
      applyTransformationMatrix(
        drawable,
        placeholderContentFit,
        sourceHeight = currentTarget?.placeholderHeight,
        sourceWidth = currentTarget?.placeholderWidth
      )
    } else {
      applyTransformationMatrix(drawable, contentFit, contentPosition)
    }
  }

  private fun applyTransformationMatrix(
    drawable: Drawable,
    contentFit: ContentFit,
    contentPosition: ContentPosition = ContentPosition.center,
    sourceWidth: Int? = currentTarget?.sourceWidth,
    sourceHeight: Int? = currentTarget?.sourceHeight
  ) {
    val imageRect = RectF(0f, 0f, drawable.intrinsicWidth.toFloat(), drawable.intrinsicHeight.toFloat())
    val viewRect = RectF(0f, 0f, width.toFloat(), height.toFloat())

    val matrix = contentFit.toMatrix(
      imageRect,
      viewRect,
      sourceWidth ?: -1,
      sourceHeight ?: -1
    )
    val scaledImageRect = imageRect.transform(matrix)

    imageMatrix = matrix.apply {
      contentPosition.apply(this, scaledImageRect, viewRect)
    }
  }

  init {
    clipToOutline = true
    scaleType = ScaleType.MATRIX
  }

  // region Component Props
  internal var contentFit: ContentFit = ContentFit.Cover
    set(value) {
      field = value
      transformationMatrixChanged = true
    }

  internal var placeholderContentFit: ContentFit = ContentFit.ScaleDown
    set(value) {
      field = value
      transformationMatrixChanged = true
    }

  internal var contentPosition: ContentPosition = ContentPosition.center
    set(value) {
      field = value
      transformationMatrixChanged = true
    }

  internal fun setTintColor(color: Int?) {
    color?.let { setColorFilter(it, PorterDuff.Mode.SRC_IN) } ?: clearColorFilter()
  }

  override fun draw(canvas: Canvas) {
    // If we encounter a recycled bitmap here, it suggests an issue where we may have failed to
    // finish clearing the image bitmap before the UI attempts to display it.
    // One solution could be to suppress the error and assume that the second image view is currently responsible for displaying the correct view.
    if ((drawable as? BitmapDrawable)?.bitmap?.isRecycled == true) {
      Log.e("ExpoImage", "Trying to use a recycled bitmap")
      recycleView()?.let { target ->
        (parent as? ExpoImageViewWrapper)?.requestManager?.let { requestManager ->
          target.clear(requestManager)
        }
      }
    }
    super.draw(canvas)
  }
}
