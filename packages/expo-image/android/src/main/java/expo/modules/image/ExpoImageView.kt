package expo.modules.image

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.PorterDuff
import android.graphics.RectF
import android.graphics.drawable.Drawable
import androidx.appcompat.widget.AppCompatImageView
import androidx.core.graphics.transform
import androidx.core.view.isVisible
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.view.ReactViewBackgroundDrawable
import expo.modules.image.drawing.OutlineProvider
import expo.modules.image.enums.ContentFit
import expo.modules.image.records.ContentPosition

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
    ReactViewBackgroundDrawable(context).apply {
      callback = this@ExpoImageView

      outlineProvider.borderRadiiConfig
        .map { it.ifYogaDefinedUse(PixelUtil::toPixelFromDIP) }
        .withIndex()
        .forEach { (i, radius) ->
          if (i == 0) {
            setRadius(radius)
          } else {
            setRadius(radius, i - 1)
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
      applyTransformationMatrix(drawable, placeholderContentFit)
    } else {
      applyTransformationMatrix(drawable, contentFit, contentPosition)
    }
  }

  private fun applyTransformationMatrix(
    drawable: Drawable,
    contentFit: ContentFit,
    contentPosition: ContentPosition = ContentPosition.center
  ) {
    val imageRect = RectF(0f, 0f, drawable.intrinsicWidth.toFloat(), drawable.intrinsicHeight.toFloat())
    val viewRect = RectF(0f, 0f, width.toFloat(), height.toFloat())

    val matrix = contentFit.toMatrix(imageRect, viewRect)
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
        if (position == 0) {
          setRadius(radius)
        } else {
          setRadius(radius, position - 1)
        }
      }
    }
  }

  internal fun setBorderWidth(position: Int, width: Float) {
    borderDrawable.setBorderWidth(position, width)
  }

  internal fun setBorderColor(position: Int, rgb: Float, alpha: Float) {
    borderDrawable.setBorderColor(position, rgb, alpha)
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
    super.draw(canvas)
  }

  public override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    // Draw borders on top of the background and image
    if (borderDrawableLazyHolder.isInitialized()) {
      val layoutDirection = if (I18nUtil.getInstance().isRTL(context)) {
        LAYOUT_DIRECTION_RTL
      } else {
        LAYOUT_DIRECTION_LTR
      }

      borderDrawable.apply {
        resolvedLayoutDirection = layoutDirection
        setBounds(0, 0, width, height)
        draw(canvas)
      }
    }
  }
}
