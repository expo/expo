package expo.modules.image

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.PorterDuff
import android.graphics.RectF
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Log
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.graphics.transform
import androidx.core.view.isVisible
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable
import com.facebook.react.uimanager.style.BorderRadiusProp
import expo.modules.image.drawing.OutlineProvider
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

  private val outlineProvider = OutlineProvider(context)

  private var transformationMatrixChanged = false

  private val borderDrawableLazyHolder = lazy {
    CSSBackgroundDrawable(context).apply {
      callback = this@ExpoImageView

      outlineProvider.borderRadiiConfig
        .map { it.ifYogaDefinedUse(PixelUtil::toPixelFromDIP) }
        .withIndex()
        .forEach { (i, radius) ->
          val appliedRadius =
            if (radius.isNaN()) {
              null
            } else {
              LengthPercentage(radius, LengthPercentageType.POINT)
            }
          if (i == 0) {
            BackgroundStyleApplicator.setBorderRadius(
              this@ExpoImageView,
              BorderRadiusProp.BORDER_RADIUS,
              appliedRadius
            )
          } else {
            BackgroundStyleApplicator.setBorderRadius(this@ExpoImageView, BorderRadiusProp.entries[i - 1], appliedRadius)
          }
        }
    }
  }

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

  private val borderDrawable
    get() = borderDrawableLazyHolder.value

  init {
    clipToOutline = true
    scaleType = ScaleType.MATRIX
    super.setOutlineProvider(outlineProvider)
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

  internal fun setBorderRadius(position: Int, borderRadius: Float) {
    val isInvalidated = outlineProvider.setBorderRadius(borderRadius, position)
    if (isInvalidated) {
      invalidateOutline()
      if (!outlineProvider.hasEqualCorners()) {
        invalidate()
      }
    }

    // Setting the border-radius doesn't necessarily mean that a border
    // should to be drawn. Only update the border-drawable when needed.
    if (borderDrawableLazyHolder.isInitialized()) {
      val radius = borderRadius.ifYogaDefinedUse(PixelUtil::toPixelFromDIP)
      borderDrawableLazyHolder.value.apply {
        val appliedRadius =
          if (radius.isNaN()) {
            null
          } else {
            LengthPercentage(radius, LengthPercentageType.POINT)
          }
        if (position == 0) {
          BackgroundStyleApplicator.setBorderRadius(
            this@ExpoImageView,
            BorderRadiusProp.BORDER_RADIUS,
            appliedRadius
          )
        } else {
          BackgroundStyleApplicator.setBorderRadius(this@ExpoImageView, BorderRadiusProp.entries[position - 1], appliedRadius)
        }
      }
    }
  }

  internal fun setBorderWidth(position: Int, width: Float) {
    borderDrawable.setBorderWidth(position, width)
  }

  internal fun setBorderColor(position: Int, color: Int) {
    borderDrawable.setBorderColor(position, color)
  }

  internal fun setBorderStyle(style: String?) {
    borderDrawable.setBorderStyle(style)
  }

  internal fun setBackgroundColor(color: Int?) {
    if (color == null) {
      setBackgroundColor(Color.TRANSPARENT)
    } else {
      setBackgroundColor(color)
    }
  }

  internal fun setTintColor(color: Int?) {
    color?.let { setColorFilter(it, PorterDuff.Mode.SRC_IN) } ?: clearColorFilter()
  }

  override fun invalidateDrawable(drawable: Drawable) {
    super.invalidateDrawable(drawable)
    if (borderDrawableLazyHolder.isInitialized() && drawable === borderDrawable) {
      invalidate()
    }
  }

  override fun draw(canvas: Canvas) {
    // When the border-radii are not all the same, a convex-path
    // is used for the Outline. Unfortunately clipping is not supported
    // for convex-paths and we fallback to Canvas clipping.
    outlineProvider.clipCanvasIfNeeded(canvas, this)
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

  public override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    // Draw borders on top of the background and image
    if (borderDrawableLazyHolder.isInitialized()) {
      val newLayoutDirection = if (I18nUtil.instance.isRTL(context)) {
        LAYOUT_DIRECTION_RTL
      } else {
        LAYOUT_DIRECTION_LTR
      }

      borderDrawable.apply {
        layoutDirection = newLayoutDirection
        setBounds(0, 0, width, height)
        draw(canvas)
      }
    }
  }
}
