package expo.modules.image.drawing

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.PathEffect
import android.graphics.DashPathEffect
import com.facebook.react.uimanager.Spacing
import android.graphics.RectF
import android.graphics.PointF
import com.facebook.yoga.YogaConstants
import android.graphics.ColorFilter
import com.facebook.react.views.view.ColorUtil
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.Region
import android.graphics.drawable.Drawable
import android.view.View
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.uimanager.FloatUtil
import com.facebook.react.modules.i18nmanager.I18nUtil
import expo.modules.image.ifYogaUndefinedUse
import expo.modules.image.isYogaPositive
import java.util.*
import kotlin.math.max

/**
 * A modified version of ReactBackgroundDrawable that fixes various issues.
 * These issues have been submitted to the upstream react-native repo.
 * Once fixes this class is a candidate for removal and we can use
 * ReactBackgroundDrawable from RN instead.
 * https://github.com/facebook/react-native/pull/28356
 * https://github.com/facebook/react-native/pull/28358
 * https://github.com/facebook/react-native/pull/28359
 */
class BorderDrawable(private val mContext: Context) : Drawable() {
  private enum class BorderStyle {
    SOLID, DASHED, DOTTED;

    companion object {
      fun getPathEffect(style: BorderStyle?, borderWidth: Float): PathEffect? {
        return when (style) {
          SOLID -> null
          DASHED -> DashPathEffect(floatArrayOf(borderWidth * 3, borderWidth * 3, borderWidth * 3, borderWidth * 3), 0F)
          DOTTED -> DashPathEffect(floatArrayOf(borderWidth, borderWidth, borderWidth, borderWidth), 0F)
          else -> null
        }
      }
    }
  }

  /* Value at Spacing.ALL index used for rounded borders, whole array used by rectangular borders */
  private var mBorderWidth: Spacing? = null
  private var mBorderRGB: Spacing? = null
  private var mBorderAlpha: Spacing? = null
  private var mBorderStyle: BorderStyle? = null

  /* Used for rounded border and rounded background */
  private var mPathEffectForBorderStyle: PathEffect? = null
  private var mInnerClipPathForBorderRadius: Path? = null
  private var mOuterClipPathForBorderRadius: Path? = null
  private var mPathForBorderRadiusOutline: Path? = null
  private var mPathForBorder: Path? = null
  private var mCenterDrawPath: Path? = null
  private var mInnerClipTempRectForBorderRadius: RectF? = null
  private var mOuterClipTempRectForBorderRadius: RectF? = null
  private var mTempRectForCenterDrawPath: RectF? = null
  private var mInnerTopLeftCorner: PointF? = null
  private var mInnerTopRightCorner: PointF? = null
  private var mInnerBottomRightCorner: PointF? = null
  private var mInnerBottomLeftCorner: PointF? = null
  private var mNeedUpdatePathForBorderRadius = false
  private var mBorderRadius = YogaConstants.UNDEFINED

  /* Used by all types of background and for drawing borders */
  private val mPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var mColor = Color.TRANSPARENT
  private var mAlpha = 255
  private var mBorderCornerRadii: FloatArray? = null

  /**
   * Similar to Drawable.getLayoutDirection, but available in APIs < 23.
   */
  var resolvedLayoutDirection = 0
    private set

  enum class BorderRadiusLocation {
    TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT, TOP_START, TOP_END, BOTTOM_START, BOTTOM_END
  }

  override fun draw(canvas: Canvas) {
    updatePathEffect()
    if (!hasRoundedBorders() && mBorderStyle == BorderStyle.SOLID) {
      drawRectangularBackgroundWithBorders(canvas)
    } else {
      drawRoundedBackgroundWithBorders(canvas)
    }
  }

  private fun hasRoundedBorders(): Boolean {
    if (isYogaPositive(mBorderRadius)) {
      return true
    }
    if (mBorderCornerRadii != null) {
      for (borderRadii in mBorderCornerRadii!!) {
        if (isYogaPositive(borderRadii)) {
          return true
        }
      }
    }
    return false
  }

  override fun onBoundsChange(bounds: Rect) {
    super.onBoundsChange(bounds)
    mNeedUpdatePathForBorderRadius = true
  }

  override fun setAlpha(alpha: Int) {
    if (alpha != mAlpha) {
      mAlpha = alpha
      invalidateSelf()
    }
  }

  override fun getAlpha(): Int {
    return mAlpha
  }

  override fun setColorFilter(cf: ColorFilter?) {
    // do nothing
  }

  override fun getOpacity(): Int {
    return ColorUtil.getOpacityFromColor(ColorUtil.multiplyColorAlpha(mColor, mAlpha))
  }

  /* Android's elevation implementation requires this to be implemented to know where to draw the shadow. */
  override fun getOutline(outline: Outline) {
    if (isYogaPositive(mBorderRadius) || mBorderCornerRadii != null) {
      updatePath()
      outline.setConvexPath(mPathForBorderRadiusOutline!!)
    } else {
      outline.setRect(bounds)
    }
  }

  fun setBorderWidth(position: Int, width: Float) {
    val borderWidth = mBorderWidth ?: Spacing()
    if (!FloatUtil.floatsEqual(borderWidth.getRaw(position), width)) {
      borderWidth[position] = width
      when (position) {
        Spacing.ALL,
        Spacing.LEFT,
        Spacing.BOTTOM,
        Spacing.RIGHT,
        Spacing.TOP,
        Spacing.START,
        Spacing.END -> mNeedUpdatePathForBorderRadius = true
      }
      mBorderWidth = borderWidth
      invalidateSelf()
    }
  }

  fun setBorderColor(position: Int, rgb: Float, alpha: Float) {
    setBorderRGB(position, rgb)
    setBorderAlpha(position, alpha)
  }

  private fun setBorderRGB(position: Int, rgb: Float) {
    // set RGB component
    if (mBorderRGB == null) {
      mBorderRGB = Spacing(DEFAULT_BORDER_RGB.toFloat())
    }
    if (!FloatUtil.floatsEqual(mBorderRGB!!.getRaw(position), rgb)) {
      mBorderRGB!![position] = rgb
      invalidateSelf()
    }
  }

  private fun setBorderAlpha(position: Int, alpha: Float) {
    // set Alpha component
    if (mBorderAlpha == null) {
      mBorderAlpha = Spacing(DEFAULT_BORDER_ALPHA.toFloat())
    }
    if (!FloatUtil.floatsEqual(mBorderAlpha!!.getRaw(position), alpha)) {
      mBorderAlpha!![position] = alpha
      invalidateSelf()
    }
  }

  fun setBorderStyle(style: String?) {
    val borderStyle = if (style == null) null else BorderStyle.valueOf(style.toUpperCase(Locale.US))
    if (mBorderStyle != borderStyle) {
      mBorderStyle = borderStyle
      mNeedUpdatePathForBorderRadius = true
      invalidateSelf()
    }
  }

  fun setRadius(radius: Float) {
    if (!FloatUtil.floatsEqual(mBorderRadius, radius)) {
      mBorderRadius = radius
      mNeedUpdatePathForBorderRadius = true
      invalidateSelf()
    }
  }

  fun setRadius(radius: Float, position: Int) {
    if (mBorderCornerRadii == null) {
      mBorderCornerRadii = FloatArray(8)
      Arrays.fill(mBorderCornerRadii!!, YogaConstants.UNDEFINED)
    }
    if (!FloatUtil.floatsEqual(mBorderCornerRadii!![position], radius)) {
      mBorderCornerRadii!![position] = radius
      mNeedUpdatePathForBorderRadius = true
      invalidateSelf()
    }
  }

  val fullBorderRadius: Float
    get() = mBorderRadius.ifYogaUndefinedUse(0F)

  private fun getBorderRadius(location: BorderRadiusLocation): Float {
    return getBorderRadiusOrDefaultTo(YogaConstants.UNDEFINED, location)
  }

  private fun getBorderRadiusOrDefaultTo(
    defaultValue: Float,
    location: BorderRadiusLocation
  ): Float {
    if (mBorderCornerRadii == null) {
      return defaultValue
    }
    val radius = mBorderCornerRadii!![location.ordinal]
    return radius.ifYogaUndefinedUse(defaultValue)
  }

  /**
   * Similar to Drawable.setLayoutDirection, but available in APIs < 23.
   */
  fun setResolvedLayoutDirection(layoutDirection: Int): Boolean {
    if (resolvedLayoutDirection != layoutDirection) {
      resolvedLayoutDirection = layoutDirection
      return onResolvedLayoutDirectionChanged(layoutDirection)
    }
    return false
  }

  /**
   * Similar to Drawable.onLayoutDirectionChanged, but available in APIs < 23.
   */
  private fun onResolvedLayoutDirectionChanged(layoutDirection: Int) = false

  @get:VisibleForTesting
  var color: Int
    get() = mColor
    set(color) {
      mColor = color
      invalidateSelf()
    }

  private fun drawRoundedBackgroundWithBorders(canvas: Canvas) {
    updatePath()
    canvas.save()
    val useColor = ColorUtil.multiplyColorAlpha(mColor, mAlpha)
    if (Color.alpha(useColor) != 0) { // color is not transparent
      mPaint.color = useColor
      mPaint.style = Paint.Style.FILL
      canvas.drawPath(mInnerClipPathForBorderRadius!!, mPaint)
    }
    val borderWidth = directionAwareBorderInsets
    var colorLeft = getBorderColor(Spacing.LEFT)
    val colorTop = getBorderColor(Spacing.TOP)
    var colorRight = getBorderColor(Spacing.RIGHT)
    val colorBottom = getBorderColor(Spacing.BOTTOM)
    if (borderWidth.top > 0 || borderWidth.bottom > 0 || borderWidth.left > 0 || borderWidth.right > 0) {

      // If it's a full and even border draw inner rect path with stroke
      val fullBorderWidth = fullBorderWidth
      val borderColor = getBorderColor(Spacing.ALL)
      if (borderWidth.top == fullBorderWidth && borderWidth.bottom == fullBorderWidth && borderWidth.left == fullBorderWidth && borderWidth.right == fullBorderWidth && colorLeft == borderColor && colorTop == borderColor && colorRight == borderColor && colorBottom == borderColor) {
        if (fullBorderWidth > 0) {
          mPaint.color = ColorUtil.multiplyColorAlpha(borderColor, mAlpha)
          mPaint.style = Paint.Style.STROKE
          mPaint.strokeWidth = fullBorderWidth
          canvas.drawPath(mCenterDrawPath!!, mPaint)
        }
      } else {
        mPaint.style = Paint.Style.FILL

        // Draw border
        canvas.clipPath(mOuterClipPathForBorderRadius!!, Region.Op.INTERSECT)
        canvas.clipPath(mInnerClipPathForBorderRadius!!, Region.Op.DIFFERENCE)
        val isRTL = resolvedLayoutDirection == View.LAYOUT_DIRECTION_RTL
        var colorStart = getBorderColor(Spacing.START)
        var colorEnd = getBorderColor(Spacing.END)
        if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext)) {
          if (!isBorderColorDefined(Spacing.START)) {
            colorStart = colorLeft
          }
          if (!isBorderColorDefined(Spacing.END)) {
            colorEnd = colorRight
          }
          val directionAwareColorLeft = if (isRTL) colorEnd else colorStart
          val directionAwareColorRight = if (isRTL) colorStart else colorEnd
          colorLeft = directionAwareColorLeft
          colorRight = directionAwareColorRight
        } else {
          val directionAwareColorLeft = if (isRTL) colorEnd else colorStart
          val directionAwareColorRight = if (isRTL) colorStart else colorEnd
          val isColorStartDefined = isBorderColorDefined(Spacing.START)
          val isColorEndDefined = isBorderColorDefined(Spacing.END)
          val isDirectionAwareColorLeftDefined = if (isRTL) isColorEndDefined else isColorStartDefined
          val isDirectionAwareColorRightDefined = if (isRTL) isColorStartDefined else isColorEndDefined
          if (isDirectionAwareColorLeftDefined) {
            colorLeft = directionAwareColorLeft
          }
          if (isDirectionAwareColorRightDefined) {
            colorRight = directionAwareColorRight
          }
        }
        val left = mOuterClipTempRectForBorderRadius!!.left
        val right = mOuterClipTempRectForBorderRadius!!.right
        val top = mOuterClipTempRectForBorderRadius!!.top
        val bottom = mOuterClipTempRectForBorderRadius!!.bottom
        if (borderWidth.left > 0) {
          val x2 = mInnerTopLeftCorner!!.x
          val y2 = mInnerTopLeftCorner!!.y
          val x3 = mInnerBottomLeftCorner!!.x
          val y3 = mInnerBottomLeftCorner!!.y
          drawQuadrilateral(canvas, colorLeft, left, top, x2, y2, x3, y3, left, bottom)
        }
        if (borderWidth.top > 0) {
          val x2 = mInnerTopLeftCorner!!.x
          val y2 = mInnerTopLeftCorner!!.y
          val x3 = mInnerTopRightCorner!!.x
          val y3 = mInnerTopRightCorner!!.y
          drawQuadrilateral(canvas, colorTop, left, top, x2, y2, x3, y3, right, top)
        }
        if (borderWidth.right > 0) {
          val x2 = mInnerTopRightCorner!!.x
          val y2 = mInnerTopRightCorner!!.y
          val x3 = mInnerBottomRightCorner!!.x
          val y3 = mInnerBottomRightCorner!!.y
          drawQuadrilateral(canvas, colorRight, right, top, x2, y2, x3, y3, right, bottom)
        }
        if (borderWidth.bottom > 0) {
          val x2 = mInnerBottomLeftCorner!!.x
          val y2 = mInnerBottomLeftCorner!!.y
          val x3 = mInnerBottomRightCorner!!.x
          val y3 = mInnerBottomRightCorner!!.y
          drawQuadrilateral(canvas, colorBottom, left, bottom, x2, y2, x3, y3, right, bottom)
        }
      }
    }
    canvas.restore()
  }

  private fun updatePath() {
    if (!mNeedUpdatePathForBorderRadius) {
      return
    }
    mNeedUpdatePathForBorderRadius = false
    if (mInnerClipPathForBorderRadius == null) {
      mInnerClipPathForBorderRadius = Path()
    }
    if (mOuterClipPathForBorderRadius == null) {
      mOuterClipPathForBorderRadius = Path()
    }
    if (mPathForBorderRadiusOutline == null) {
      mPathForBorderRadiusOutline = Path()
    }
    if (mCenterDrawPath == null) {
      mCenterDrawPath = Path()
    }
    if (mInnerClipTempRectForBorderRadius == null) {
      mInnerClipTempRectForBorderRadius = RectF()
    }
    if (mOuterClipTempRectForBorderRadius == null) {
      mOuterClipTempRectForBorderRadius = RectF()
    }
    if (mTempRectForCenterDrawPath == null) {
      mTempRectForCenterDrawPath = RectF()
    }
    mInnerClipPathForBorderRadius!!.reset()
    mOuterClipPathForBorderRadius!!.reset()
    mPathForBorderRadiusOutline!!.reset()
    mCenterDrawPath!!.reset()
    mInnerClipTempRectForBorderRadius!!.set(bounds)
    mOuterClipTempRectForBorderRadius!!.set(bounds)
    mTempRectForCenterDrawPath!!.set(bounds)
    val borderWidth = directionAwareBorderInsets
    mInnerClipTempRectForBorderRadius!!.top += borderWidth.top
    mInnerClipTempRectForBorderRadius!!.bottom -= borderWidth.bottom
    mInnerClipTempRectForBorderRadius!!.left += borderWidth.left
    mInnerClipTempRectForBorderRadius!!.right -= borderWidth.right
    mTempRectForCenterDrawPath!!.top += borderWidth.top * 0.5f
    mTempRectForCenterDrawPath!!.bottom -= borderWidth.bottom * 0.5f
    mTempRectForCenterDrawPath!!.left += borderWidth.left * 0.5f
    mTempRectForCenterDrawPath!!.right -= borderWidth.right * 0.5f
    val borderRadius = fullBorderRadius
    var topLeftRadius = getBorderRadiusOrDefaultTo(borderRadius, BorderRadiusLocation.TOP_LEFT)
    var topRightRadius = getBorderRadiusOrDefaultTo(borderRadius, BorderRadiusLocation.TOP_RIGHT)
    var bottomLeftRadius = getBorderRadiusOrDefaultTo(borderRadius, BorderRadiusLocation.BOTTOM_LEFT)
    var bottomRightRadius = getBorderRadiusOrDefaultTo(borderRadius, BorderRadiusLocation.BOTTOM_RIGHT)
    val isRTL = resolvedLayoutDirection == View.LAYOUT_DIRECTION_RTL
    var topStartRadius = getBorderRadius(BorderRadiusLocation.TOP_START)
    var topEndRadius = getBorderRadius(BorderRadiusLocation.TOP_END)
    var bottomStartRadius = getBorderRadius(BorderRadiusLocation.BOTTOM_START)
    var bottomEndRadius = getBorderRadius(BorderRadiusLocation.BOTTOM_END)
    if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext)) {
      if (YogaConstants.isUndefined(topStartRadius)) {
        topStartRadius = topLeftRadius
      }
      if (YogaConstants.isUndefined(topEndRadius)) {
        topEndRadius = topRightRadius
      }
      if (YogaConstants.isUndefined(bottomStartRadius)) {
        bottomStartRadius = bottomLeftRadius
      }
      if (YogaConstants.isUndefined(bottomEndRadius)) {
        bottomEndRadius = bottomRightRadius
      }
      val directionAwareTopLeftRadius = if (isRTL) topEndRadius else topStartRadius
      val directionAwareTopRightRadius = if (isRTL) topStartRadius else topEndRadius
      val directionAwareBottomLeftRadius = if (isRTL) bottomEndRadius else bottomStartRadius
      val directionAwareBottomRightRadius = if (isRTL) bottomStartRadius else bottomEndRadius
      topLeftRadius = directionAwareTopLeftRadius
      topRightRadius = directionAwareTopRightRadius
      bottomLeftRadius = directionAwareBottomLeftRadius
      bottomRightRadius = directionAwareBottomRightRadius
    } else {
      val directionAwareTopLeftRadius = if (isRTL) topEndRadius else topStartRadius
      val directionAwareTopRightRadius = if (isRTL) topStartRadius else topEndRadius
      val directionAwareBottomLeftRadius = if (isRTL) bottomEndRadius else bottomStartRadius
      val directionAwareBottomRightRadius = if (isRTL) bottomStartRadius else bottomEndRadius
      if (!YogaConstants.isUndefined(directionAwareTopLeftRadius)) {
        topLeftRadius = directionAwareTopLeftRadius
      }
      if (!YogaConstants.isUndefined(directionAwareTopRightRadius)) {
        topRightRadius = directionAwareTopRightRadius
      }
      if (!YogaConstants.isUndefined(directionAwareBottomLeftRadius)) {
        bottomLeftRadius = directionAwareBottomLeftRadius
      }
      if (!YogaConstants.isUndefined(directionAwareBottomRightRadius)) {
        bottomRightRadius = directionAwareBottomRightRadius
      }
    }
    val innerTopLeftRadiusX = Math.max(topLeftRadius - borderWidth.left, 0f)
    val innerTopLeftRadiusY = Math.max(topLeftRadius - borderWidth.top, 0f)
    val innerTopRightRadiusX = Math.max(topRightRadius - borderWidth.right, 0f)
    val innerTopRightRadiusY = Math.max(topRightRadius - borderWidth.top, 0f)
    val innerBottomRightRadiusX = Math.max(bottomRightRadius - borderWidth.right, 0f)
    val innerBottomRightRadiusY = Math.max(bottomRightRadius - borderWidth.bottom, 0f)
    val innerBottomLeftRadiusX = Math.max(bottomLeftRadius - borderWidth.left, 0f)
    val innerBottomLeftRadiusY = Math.max(bottomLeftRadius - borderWidth.bottom, 0f)
    mInnerClipPathForBorderRadius!!.addRoundRect(
        mInnerClipTempRectForBorderRadius!!, floatArrayOf(
        innerTopLeftRadiusX,
        innerTopLeftRadiusY,
        innerTopRightRadiusX,
        innerTopRightRadiusY,
        innerBottomRightRadiusX,
        innerBottomRightRadiusY,
        innerBottomLeftRadiusX,
        innerBottomLeftRadiusY),
        Path.Direction.CW)
    mOuterClipPathForBorderRadius!!.addRoundRect(
        mOuterClipTempRectForBorderRadius!!, floatArrayOf(
        topLeftRadius,
        topLeftRadius,
        topRightRadius,
        topRightRadius,
        bottomRightRadius,
        bottomRightRadius,
        bottomLeftRadius,
        bottomLeftRadius
    ),
        Path.Direction.CW)
    var extraRadiusForOutline = 0f
    if (mBorderWidth != null) {
      extraRadiusForOutline = mBorderWidth!![Spacing.ALL] / 2f
    }
    mPathForBorderRadiusOutline!!.addRoundRect(
        mOuterClipTempRectForBorderRadius!!, floatArrayOf(
        topLeftRadius + extraRadiusForOutline,
        topLeftRadius + extraRadiusForOutline,
        topRightRadius + extraRadiusForOutline,
        topRightRadius + extraRadiusForOutline,
        bottomRightRadius + extraRadiusForOutline,
        bottomRightRadius + extraRadiusForOutline,
        bottomLeftRadius + extraRadiusForOutline,
        bottomLeftRadius + extraRadiusForOutline
    ),
        Path.Direction.CW)
    mCenterDrawPath!!.addRoundRect(
        mTempRectForCenterDrawPath!!, floatArrayOf(
        max(topLeftRadius - borderWidth.left * 0.5f, 0f),
        max(topLeftRadius - borderWidth.top * 0.5f, 0f),
        max(topRightRadius - borderWidth.right * 0.5f, 0f),
        max(topRightRadius - borderWidth.top * 0.5f, 0f),
        max(bottomRightRadius - borderWidth.right * 0.5f, 0f),
        max(bottomRightRadius - borderWidth.bottom * 0.5f, 0f),
        max(bottomLeftRadius - borderWidth.left * 0.5f, 0f),
        max(bottomLeftRadius - borderWidth.bottom * 0.5f, 0f)
    ),
        Path.Direction.CW)
    /**
     * Rounded Multi-Colored Border Algorithm:
     *
     *
     * Let O (for outer) = (top, left, bottom, right) be the rectangle that represents the size
     * and position of a view V. Since the box-sizing of all React Native views is border-box, any
     * border of V will render inside O.
     *
     *
     * Let BorderWidth = (borderTop, borderLeft, borderBottom, borderRight).
     *
     *
     * Let I (for inner) = O - BorderWidth.
     *
     *
     * Then, remembering that O and I are rectangles and that I is inside O, O - I gives us the
     * border of V. Therefore, we can use canvas.clipPath to draw V's border.
     *
     *
     * canvas.clipPath(O, Region.OP.INTERSECT);
     *
     *
     * canvas.clipPath(I, Region.OP.DIFFERENCE);
     *
     *
     * canvas.drawRect(O, paint);
     *
     *
     * This lets us draw non-rounded single-color borders.
     *
     *
     * To extend this algorithm to rounded single-color borders, we:
     *
     *
     * 1. Curve the corners of O by the (border radii of V) using Path#addRoundRect.
     *
     *
     * 2. Curve the corners of I by (border radii of V - border widths of V) using
     * Path#addRoundRect.
     *
     *
     * Let O' = curve(O, border radii of V).
     *
     *
     * Let I' = curve(I, border radii of V - border widths of V)
     *
     *
     * The rationale behind this decision is the (first sentence of the) following section in the
     * CSS Backgrounds and Borders Module Level 3:
     * https://www.w3.org/TR/css3-background/#the-border-radius.
     *
     *
     * After both O and I have been curved, we can execute the following lines once again to
     * render curved single-color borders:
     *
     *
     * canvas.clipPath(O, Region.OP.INTERSECT);
     *
     *
     * canvas.clipPath(I, Region.OP.DIFFERENCE);
     *
     *
     * canvas.drawRect(O, paint);
     *
     *
     * To extend this algorithm to rendering multi-colored rounded borders, we render each side
     * of the border as its own quadrilateral. Suppose that we were handling the case where all the
     * border radii are 0. Then, the four quadrilaterals would be:
     *
     *
     * Left: (O.left, O.top), (I.left, I.top), (I.left, I.bottom), (O.left, O.bottom)
     *
     *
     * Top: (O.left, O.top), (I.left, I.top), (I.right, I.top), (O.right, O.top)
     *
     *
     * Right: (O.right, O.top), (I.right, I.top), (I.right, I.bottom), (O.right, O.bottom)
     *
     *
     * Bottom: (O.right, O.bottom), (I.right, I.bottom), (I.left, I.bottom), (O.left, O.bottom)
     *
     *
     * Now, lets consider what happens when we render a rounded border (radii != 0). For the sake
     * of simplicity, let's focus on the top edge of the Left border:
     *
     *
     * Let borderTopLeftRadius = 5. Let borderLeftWidth = 1. Let borderTopWidth = 2.
     *
     *
     * We know that O is curved by the ellipse E_O (a = 5, b = 5). We know that I is curved by
     * the ellipse E_I (a = 5 - 1, b = 5 - 2).
     *
     *
     * Since we have clipping, it should be safe to set the top-left point of the Left
     * quadrilateral's top edge to (O.left, O.top).
     *
     *
     * But, what should the top-right point be?
     *
     *
     * The fact that the border is curved shouldn't change the slope (nor the position) of the
     * line connecting the top-left and top-right points of the Left quadrilateral's top edge.
     * Therefore, The top-right point should lie somewhere on the line L = (1 - a) * (O.left, O.top)
     * + a * (I.left, I.top).
     *
     *
     * a != 0, because then the top-left and top-right points would be the same and
     * borderLeftWidth = 1. a != 1, because then the top-right point would not touch an edge of the
     * ellipse E_I. We want the top-right point to touch an edge of the inner ellipse because the
     * border curves with E_I on the top-left corner of V.
     *
     *
     * Therefore, it must be the case that a > 1. Two natural locations of the top-right point
     * exist: 1. The first intersection of L with E_I. 2. The second intersection of L with E_I.
     *
     *
     * We choose the top-right point of the top edge of the Left quadrilateral to be an arbitrary
     * intersection of L with E_I.
     */
    if (mInnerTopLeftCorner == null) {
      mInnerTopLeftCorner = PointF()
    }
    /** Compute mInnerTopLeftCorner  */
    mInnerTopLeftCorner!!.x = mInnerClipTempRectForBorderRadius!!.left
    mInnerTopLeftCorner!!.y = mInnerClipTempRectForBorderRadius!!.top
    getEllipseIntersectionWithLine(
        // Ellipse Bounds
        mInnerClipTempRectForBorderRadius!!.left.toDouble(),
        mInnerClipTempRectForBorderRadius!!.top.toDouble(), (
        mInnerClipTempRectForBorderRadius!!.left + 2 * innerTopLeftRadiusX).toDouble(), (
        mInnerClipTempRectForBorderRadius!!.top + 2 * innerTopLeftRadiusY).toDouble(), // Line Start
        mOuterClipTempRectForBorderRadius!!.left.toDouble(),
        mOuterClipTempRectForBorderRadius!!.top.toDouble(), // Line End
        mInnerClipTempRectForBorderRadius!!.left.toDouble(), //
        mInnerClipTempRectForBorderRadius!!.top.toDouble(), // Result
        mInnerTopLeftCorner!!)
    /** Compute mInnerBottomLeftCorner  */
    if (mInnerBottomLeftCorner == null) {
      mInnerBottomLeftCorner = PointF()
    }
    mInnerBottomLeftCorner!!.x = mInnerClipTempRectForBorderRadius!!.left
    mInnerBottomLeftCorner!!.y = mInnerClipTempRectForBorderRadius!!.bottom
    getEllipseIntersectionWithLine(
        // Ellipse Bounds
        mInnerClipTempRectForBorderRadius!!.left.toDouble(), (
        mInnerClipTempRectForBorderRadius!!.bottom - 2 * innerBottomLeftRadiusY).toDouble(), (
        mInnerClipTempRectForBorderRadius!!.left + 2 * innerBottomLeftRadiusX).toDouble(),
        mInnerClipTempRectForBorderRadius!!.bottom.toDouble(), // Line Start
        mOuterClipTempRectForBorderRadius!!.left.toDouble(),
        mOuterClipTempRectForBorderRadius!!.bottom.toDouble(), // Line End
        mInnerClipTempRectForBorderRadius!!.left.toDouble(),
        mInnerClipTempRectForBorderRadius!!.bottom.toDouble(), // Result
        mInnerBottomLeftCorner!!)
    /** Compute mInnerTopRightCorner  */
    if (mInnerTopRightCorner == null) {
      mInnerTopRightCorner = PointF()
    }
    mInnerTopRightCorner!!.x = mInnerClipTempRectForBorderRadius!!.right
    mInnerTopRightCorner!!.y = mInnerClipTempRectForBorderRadius!!.top
    getEllipseIntersectionWithLine((
        // Ellipse Bounds
        mInnerClipTempRectForBorderRadius!!.right - 2 * innerTopRightRadiusX).toDouble(),
        mInnerClipTempRectForBorderRadius!!.top.toDouble(),
        mInnerClipTempRectForBorderRadius!!.right.toDouble(), (
        mInnerClipTempRectForBorderRadius!!.top + 2 * innerTopRightRadiusY).toDouble(), // Line Start
        mOuterClipTempRectForBorderRadius!!.right.toDouble(),
        mOuterClipTempRectForBorderRadius!!.top.toDouble(), // Line End
        mInnerClipTempRectForBorderRadius!!.right.toDouble(),
        mInnerClipTempRectForBorderRadius!!.top.toDouble(), // Result
        mInnerTopRightCorner!!)
    /** Compute mInnerBottomRightCorner  */
    if (mInnerBottomRightCorner == null) {
      mInnerBottomRightCorner = PointF()
    }
    mInnerBottomRightCorner!!.x = mInnerClipTempRectForBorderRadius!!.right
    mInnerBottomRightCorner!!.y = mInnerClipTempRectForBorderRadius!!.bottom
    getEllipseIntersectionWithLine((
        // Ellipse Bounds
        mInnerClipTempRectForBorderRadius!!.right - 2 * innerBottomRightRadiusX).toDouble(), (
        mInnerClipTempRectForBorderRadius!!.bottom - 2 * innerBottomRightRadiusY).toDouble(),
        mInnerClipTempRectForBorderRadius!!.right.toDouble(),
        mInnerClipTempRectForBorderRadius!!.bottom.toDouble(), // Line Start
        mOuterClipTempRectForBorderRadius!!.right.toDouble(),
        mOuterClipTempRectForBorderRadius!!.bottom.toDouble(), // Line End
        mInnerClipTempRectForBorderRadius!!.right.toDouble(),
        mInnerClipTempRectForBorderRadius!!.bottom.toDouble(), // Result
        mInnerBottomRightCorner!!)
  }

  private fun getBorderWidthOrDefaultTo(defaultValue: Float, spacingType: Int): Float {
    if (mBorderWidth == null) {
      return defaultValue
    }
    val width = mBorderWidth!!.getRaw(spacingType)
    return width.ifYogaUndefinedUse(defaultValue)
  }

  /**
   * Set type of border
   */
  private fun updatePathEffect() {
    mPathEffectForBorderStyle = if (mBorderStyle != null) BorderStyle.getPathEffect(mBorderStyle, fullBorderWidth) else null
    mPaint.pathEffect = mPathEffectForBorderStyle
  }

  /**
   * For rounded borders we use default "borderWidth" property.
   */
  private val fullBorderWidth: Float
    get() = if (mBorderWidth != null && !YogaConstants.isUndefined(mBorderWidth!!.getRaw(Spacing.ALL))) mBorderWidth!!.getRaw(Spacing.ALL) else 0f

  private fun drawRectangularBackgroundWithBorders(canvas: Canvas) {
    mPaint.style = Paint.Style.FILL
    val useColor = ColorUtil.multiplyColorAlpha(mColor, mAlpha)
    if (Color.alpha(useColor) != 0) { // color is not transparent
      mPaint.color = useColor
      canvas.drawRect(bounds, mPaint)
    }
    val borderWidth = directionAwareBorderInsets
    val borderLeft = Math.round(borderWidth.left)
    val borderTop = Math.round(borderWidth.top)
    val borderRight = Math.round(borderWidth.right)
    val borderBottom = Math.round(borderWidth.bottom)

    // maybe draw borders?
    if (borderLeft > 0 || borderRight > 0 || borderTop > 0 || borderBottom > 0) {
      val bounds = bounds
      var colorLeft = getBorderColor(Spacing.LEFT)
      val colorTop = getBorderColor(Spacing.TOP)
      var colorRight = getBorderColor(Spacing.RIGHT)
      val colorBottom = getBorderColor(Spacing.BOTTOM)
      val isRTL = resolvedLayoutDirection == View.LAYOUT_DIRECTION_RTL
      var colorStart = getBorderColor(Spacing.START)
      var colorEnd = getBorderColor(Spacing.END)
      if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext)) {
        if (!isBorderColorDefined(Spacing.START)) {
          colorStart = colorLeft
        }
        if (!isBorderColorDefined(Spacing.END)) {
          colorEnd = colorRight
        }
        val directionAwareColorLeft = if (isRTL) colorEnd else colorStart
        val directionAwareColorRight = if (isRTL) colorStart else colorEnd
        colorLeft = directionAwareColorLeft
        colorRight = directionAwareColorRight
      } else {
        val directionAwareColorLeft = if (isRTL) colorEnd else colorStart
        val directionAwareColorRight = if (isRTL) colorStart else colorEnd
        val isColorStartDefined = isBorderColorDefined(Spacing.START)
        val isColorEndDefined = isBorderColorDefined(Spacing.END)
        val isDirectionAwareColorLeftDefined = if (isRTL) isColorEndDefined else isColorStartDefined
        val isDirectionAwareColorRightDefined = if (isRTL) isColorStartDefined else isColorEndDefined
        if (isDirectionAwareColorLeftDefined) {
          colorLeft = directionAwareColorLeft
        }
        if (isDirectionAwareColorRightDefined) {
          colorRight = directionAwareColorRight
        }
      }
      val left = bounds.left
      val top = bounds.top

      // Check for fast path to border drawing.
      val fastBorderColor = fastBorderCompatibleColorOrZero(
          borderLeft,
          borderTop,
          borderRight,
          borderBottom,
          colorLeft,
          colorTop,
          colorRight,
          colorBottom)
      if (fastBorderColor != 0) {
        if (Color.alpha(fastBorderColor) != 0) {
          // Border color is not transparent.
          val right = bounds.right
          val bottom = bounds.bottom
          mPaint.color = fastBorderColor
          if (borderLeft > 0) {
            val leftInset = left + borderLeft
            canvas.drawRect(left.toFloat(), top.toFloat(), leftInset.toFloat(), (bottom - borderBottom).toFloat(), mPaint)
          }
          if (borderTop > 0) {
            val topInset = top + borderTop
            canvas.drawRect((left + borderLeft).toFloat(), top.toFloat(), right.toFloat(), topInset.toFloat(), mPaint)
          }
          if (borderRight > 0) {
            val rightInset = right - borderRight
            canvas.drawRect(rightInset.toFloat(), (top + borderTop).toFloat(), right.toFloat(), bottom.toFloat(), mPaint)
          }
          if (borderBottom > 0) {
            val bottomInset = bottom - borderBottom
            canvas.drawRect(left.toFloat(), bottomInset.toFloat(), (right - borderRight).toFloat(), bottom.toFloat(), mPaint)
          }
        }
      } else {
        // If the path drawn previously is of the same color,
        // there would be a slight white space between borders
        // with anti-alias set to true.
        // Therefore we need to disable anti-alias, and
        // after drawing is done, we will re-enable it.
        mPaint.isAntiAlias = false
        val width = bounds.width()
        val height = bounds.height()
        if (borderLeft > 0) {
          val x1 = left.toFloat()
          val y1 = top.toFloat()
          val x2 = (left + borderLeft).toFloat()
          val y2 = (top + borderTop).toFloat()
          val x3 = (left + borderLeft).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = left.toFloat()
          val y4 = (top + height).toFloat()
          drawQuadrilateral(canvas, colorLeft, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderTop > 0) {
          val x1 = left.toFloat()
          val y1 = top.toFloat()
          val x2 = (left + borderLeft).toFloat()
          val y2 = (top + borderTop).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + borderTop).toFloat()
          val x4 = (left + width).toFloat()
          val y4 = top.toFloat()
          drawQuadrilateral(canvas, colorTop, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderRight > 0) {
          val x1 = (left + width).toFloat()
          val y1 = top.toFloat()
          val x2 = (left + width).toFloat()
          val y2 = (top + height).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = (left + width - borderRight).toFloat()
          val y4 = (top + borderTop).toFloat()
          drawQuadrilateral(canvas, colorRight, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderBottom > 0) {
          val x1 = left.toFloat()
          val y1 = (top + height).toFloat()
          val x2 = (left + width).toFloat()
          val y2 = (top + height).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = (left + borderLeft).toFloat()
          val y4 = (top + height - borderBottom).toFloat()
          drawQuadrilateral(canvas, colorBottom, x1, y1, x2, y2, x3, y3, x4, y4)
        }

        // re-enable anti alias
        mPaint.isAntiAlias = true
      }
    }
  }

  private fun drawQuadrilateral(
    canvas: Canvas,
    fillColor: Int,
    x1: Float,
    y1: Float,
    x2: Float,
    y2: Float,
    x3: Float,
    y3: Float,
    x4: Float,
    y4: Float
  ) {
    if (fillColor == Color.TRANSPARENT) {
      return
    }
    if (mPathForBorder == null) {
      mPathForBorder = Path()
    }
    mPaint.color = fillColor
    mPathForBorder!!.reset()
    mPathForBorder!!.moveTo(x1, y1)
    mPathForBorder!!.lineTo(x2, y2)
    mPathForBorder!!.lineTo(x3, y3)
    mPathForBorder!!.lineTo(x4, y4)
    mPathForBorder!!.lineTo(x1, y1)
    canvas.drawPath(mPathForBorder!!, mPaint)
  }

  private fun isBorderColorDefined(position: Int): Boolean {
    val rgb = if (mBorderRGB != null) mBorderRGB!![position] else YogaConstants.UNDEFINED
    val alpha = if (mBorderAlpha != null) mBorderAlpha!![position] else YogaConstants.UNDEFINED
    return !YogaConstants.isUndefined(rgb) && !YogaConstants.isUndefined(alpha)
  }

  private fun getBorderColor(position: Int): Int {
    val rgb = if (mBorderRGB != null) mBorderRGB!![position] else DEFAULT_BORDER_RGB.toFloat()
    val alpha = if (mBorderAlpha != null) mBorderAlpha!![position] else DEFAULT_BORDER_ALPHA.toFloat()
    return colorFromAlphaAndRGBComponents(alpha, rgb)
  }

  private val directionAwareBorderInsets: RectF
    get() {
      val borderWidth = getBorderWidthOrDefaultTo(0f, Spacing.ALL)
      val borderTopWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.TOP)
      val borderBottomWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.BOTTOM)
      var borderLeftWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.LEFT)
      var borderRightWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.RIGHT)
      val mBorderWidth = mBorderWidth
      if (mBorderWidth != null) {
        val isRTL = resolvedLayoutDirection == View.LAYOUT_DIRECTION_RTL
        var borderStartWidth = mBorderWidth.getRaw(Spacing.START)
        var borderEndWidth = mBorderWidth.getRaw(Spacing.END)
        if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext)) {
          if (YogaConstants.isUndefined(borderStartWidth)) {
            borderStartWidth = borderLeftWidth
          }
          if (YogaConstants.isUndefined(borderEndWidth)) {
            borderEndWidth = borderRightWidth
          }
          val directionAwareBorderLeftWidth = if (isRTL) borderEndWidth else borderStartWidth
          val directionAwareBorderRightWidth = if (isRTL) borderStartWidth else borderEndWidth
          borderLeftWidth = directionAwareBorderLeftWidth
          borderRightWidth = directionAwareBorderRightWidth
        } else {
          val directionAwareBorderLeftWidth = if (isRTL) borderEndWidth else borderStartWidth
          val directionAwareBorderRightWidth = if (isRTL) borderStartWidth else borderEndWidth
          if (!YogaConstants.isUndefined(directionAwareBorderLeftWidth)) {
            borderLeftWidth = directionAwareBorderLeftWidth
          }
          if (!YogaConstants.isUndefined(directionAwareBorderRightWidth)) {
            borderRightWidth = directionAwareBorderRightWidth
          }
        }
      }
      return RectF(borderLeftWidth, borderTopWidth, borderRightWidth, borderBottomWidth)
    }

  companion object {
    private const val DEFAULT_BORDER_COLOR = Color.BLACK
    private const val DEFAULT_BORDER_RGB = 0x00FFFFFF and DEFAULT_BORDER_COLOR
    private const val DEFAULT_BORDER_ALPHA = (0xFF000000L and (DEFAULT_BORDER_COLOR.toLong() ushr 24)).toInt()

    // ~0 == 0xFFFFFFFF, all bits set to 1.
    private const val ALL_BITS_SET = 0.inv()

    // 0 == 0x00000000, all bits set to 0.
    private const val ALL_BITS_UNSET = 0
    private fun getEllipseIntersectionWithLine(
      ellipseBoundsLeft: Double,
      ellipseBoundsTop: Double,
      ellipseBoundsRight: Double,
      ellipseBoundsBottom: Double,
      lineStartX: Double,
      lineStartY: Double,
      lineEndX: Double,
      lineEndY: Double,
      result: PointF
    ) {
      var lineStartX = lineStartX
      var lineStartY = lineStartY
      var lineEndX = lineEndX
      var lineEndY = lineEndY
      val ellipseCenterX = (ellipseBoundsLeft + ellipseBoundsRight) / 2
      val ellipseCenterY = (ellipseBoundsTop + ellipseBoundsBottom) / 2
      /**
       * Step 1:
       *
       *
       * Translate the line so that the ellipse is at the origin.
       *
       *
       * Why? It makes the math easier by changing the ellipse equation from ((x -
       * ellipseCenterX)/a)^2 + ((y - ellipseCenterY)/b)^2 = 1 to (x/a)^2 + (y/b)^2 = 1.
       */
      lineStartX -= ellipseCenterX
      lineStartY -= ellipseCenterY
      lineEndX -= ellipseCenterX
      lineEndY -= ellipseCenterY
      /**
       * Step 2:
       *
       *
       * Ellipse equation: (x/a)^2 + (y/b)^2 = 1 Line equation: y = mx + c
       */
      val a = Math.abs(ellipseBoundsRight - ellipseBoundsLeft) / 2
      val b = Math.abs(ellipseBoundsBottom - ellipseBoundsTop) / 2
      val m = (lineEndY - lineStartY) / (lineEndX - lineStartX)
      val c = lineStartY - m * lineStartX // Just a point on the line

      /**
       * Step 3:
       *
       *
       * Substitute the Line equation into the Ellipse equation. Solve for x. Eventually, you'll
       * have to use the quadratic formula.
       *
       *
       * Quadratic formula: Ax^2 + Bx + C = 0
       */
      val A = b * b + a * a * m * m
      val B = 2 * a * a * c * m
      val C = a * a * (c * c - b * b)

      /**
       * Step 4:
       *
       *
       * Apply Quadratic formula. D = determinant / 2A
       */
      val D = Math.sqrt(-C / A + Math.pow(B / (2 * A), 2.0))
      val x2 = -B / (2 * A) - D
      val y2 = m * x2 + c

      /**
       * Step 5:
       *
       *
       * Undo the space transformation in Step 5.
       */
      val x = x2 + ellipseCenterX
      val y = y2 + ellipseCenterY
      if (!x.isNaN() && !y.isNaN()) {
        result.x = x.toFloat()
        result.y = y.toFloat()
      }
    }

    /**
     * Quickly determine if all the set border colors are equal. Bitwise AND all the set colors
     * together, then OR them all together. If the AND and the OR are the same, then the colors are
     * compatible, so return this color.
     *
     *
     * Used to avoid expensive path creation and expensive calls to canvas.drawPath
     *
     * @return A compatible border color, or zero if the border colors are not compatible.
     */
    private fun fastBorderCompatibleColorOrZero(
      borderLeft: Int,
      borderTop: Int,
      borderRight: Int,
      borderBottom: Int,
      colorLeft: Int,
      colorTop: Int,
      colorRight: Int,
      colorBottom: Int
    ): Int {
      val andSmear = ((if (borderLeft > 0) colorLeft else ALL_BITS_SET)
          and (if (borderTop > 0) colorTop else ALL_BITS_SET)
          and (if (borderRight > 0) colorRight else ALL_BITS_SET)
          and if (borderBottom > 0) colorBottom else ALL_BITS_SET)
      val orSmear = ((if (borderLeft > 0) colorLeft else ALL_BITS_UNSET)
          or (if (borderTop > 0) colorTop else ALL_BITS_UNSET)
          or (if (borderRight > 0) colorRight else ALL_BITS_UNSET)
          or if (borderBottom > 0) colorBottom else ALL_BITS_UNSET)
      return if (andSmear == orSmear) andSmear else 0
    }

    private fun colorFromAlphaAndRGBComponents(alpha: Float, rgb: Float): Int {
      val rgbComponent = 0x00FFFFFFL and rgb.toLong()
      val alphaComponent = 0xFF000000L and (alpha.toLong() shl 24)
      return (rgbComponent or alphaComponent).toInt()
    }
  }
}
