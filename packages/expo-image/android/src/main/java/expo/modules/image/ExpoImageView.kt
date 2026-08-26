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
  internal var targetBindingId = 0L
    private set

  var currentTarget: ImageViewWrapperTarget? = null
    set(value) {
      field = value
      targetBindingId += 1
    }

  var isPlaceholder: Boolean = false

  internal fun recycleViewIfBindingMatches(
    target: ImageViewWrapperTarget?,
    bindingId: Long
  ): ImageViewWrapperTarget? {
    if (currentTarget !== target || targetBindingId != bindingId) {
      return null
    }
    return recycleView()
  }

  fun recycleView(): ImageViewWrapperTarget? {
    val target = currentTarget?.apply {
      isUsed = false
    }
    // Cleared before the animation is cancelled, so the cancellation callback of a transition
    // still running on this view sees that the view no longer holds that target and skips its
    // cleanup instead of re-entering this method.
    currentTarget = null

    // A view can be recycled midway through a fade. Without this the view keeps animating towards
    // an alpha it no longer wants, and can be left partially or fully transparent once it is bound
    // to its next image.
    animate().cancel()
    // ViewPropertyAnimator keeps its listener across animations, so leaving it attached can run
    // cleanup from the previous image after this view has been rebound to a new one.
    animate().setListener(null)
    alpha = 1f
    setImageDrawable(null)

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
