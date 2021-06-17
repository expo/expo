package expo.modules.image.drawing

import android.content.Context
import android.graphics.Canvas
import android.graphics.Outline
import android.graphics.Path
import android.graphics.RectF
import android.view.View
import android.view.ViewOutlineProvider
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.FloatUtil
import com.facebook.react.uimanager.PixelUtil
import com.facebook.yoga.YogaConstants
import java.util.*

class OutlineProvider(private val mContext: Context) : ViewOutlineProvider() {
  private var mLayoutDirection: Int
  private val mBounds: RectF
  val borderRadii: FloatArray
  private val mCornerRadii: FloatArray
  private var mCornerRadiiInvalidated: Boolean
  private val mConvexPath: Path
  private var mConvexPathInvalidated: Boolean
  private fun updateCornerRadiiIfNeeded() {
    if (mCornerRadiiInvalidated) {
      val isRTL = mLayoutDirection == View.LAYOUT_DIRECTION_RTL
      val isRTLSwap = I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext)
      updateCornerRadius(
        CornerRadius.TOP_LEFT,
        BorderRadiusConfig.TOP_LEFT,
        BorderRadiusConfig.TOP_RIGHT,
        BorderRadiusConfig.TOP_START,
        BorderRadiusConfig.TOP_END,
        isRTL,
        isRTLSwap
      )
      updateCornerRadius(
        CornerRadius.TOP_RIGHT,
        BorderRadiusConfig.TOP_RIGHT,
        BorderRadiusConfig.TOP_LEFT,
        BorderRadiusConfig.TOP_END,
        BorderRadiusConfig.TOP_START,
        isRTL,
        isRTLSwap
      )
      updateCornerRadius(
        CornerRadius.BOTTOM_LEFT,
        BorderRadiusConfig.BOTTOM_LEFT,
        BorderRadiusConfig.BOTTOM_RIGHT,
        BorderRadiusConfig.BOTTOM_START,
        BorderRadiusConfig.BOTTOM_END,
        isRTL,
        isRTLSwap
      )
      updateCornerRadius(
        CornerRadius.BOTTOM_RIGHT,
        BorderRadiusConfig.BOTTOM_RIGHT,
        BorderRadiusConfig.BOTTOM_LEFT,
        BorderRadiusConfig.BOTTOM_END,
        BorderRadiusConfig.BOTTOM_START,
        isRTL,
        isRTLSwap
      )
      mCornerRadiiInvalidated = false
      mConvexPathInvalidated = true
    }
  }

  private fun updateCornerRadius(outputPosition: CornerRadius, inputPosition: BorderRadiusConfig, oppositePosition: BorderRadiusConfig, startPosition: BorderRadiusConfig, endPosition: BorderRadiusConfig, isRTL: Boolean, isRTLSwap: Boolean) {
    var radius = borderRadii[inputPosition.ordinal]
    if (isRTL) {
      if (isRTLSwap) {
        radius = borderRadii[oppositePosition.ordinal]
      }
      if (YogaConstants.isUndefined(radius)) {
        radius = borderRadii[endPosition.ordinal]
      }
    } else {
      if (YogaConstants.isUndefined(radius)) {
        radius = borderRadii[startPosition.ordinal]
      }
    }
    if (YogaConstants.isUndefined(radius)) {
      radius = borderRadii[BorderRadiusConfig.ALL.ordinal]
    }
    if (YogaConstants.isUndefined(radius)) {
      radius = 0f
    }
    mCornerRadii[outputPosition.ordinal] = PixelUtil.toPixelFromDIP(radius)
  }

  private fun updateConvexPathIfNeeded() {
    if (mConvexPathInvalidated) {
      mConvexPath.reset()
      mConvexPath.addRoundRect(
        mBounds, floatArrayOf(
        mCornerRadii[CornerRadius.TOP_LEFT.ordinal],
        mCornerRadii[CornerRadius.TOP_LEFT.ordinal],
        mCornerRadii[CornerRadius.TOP_RIGHT.ordinal],
        mCornerRadii[CornerRadius.TOP_RIGHT.ordinal],
        mCornerRadii[CornerRadius.BOTTOM_RIGHT.ordinal],
        mCornerRadii[CornerRadius.BOTTOM_RIGHT.ordinal],
        mCornerRadii[CornerRadius.BOTTOM_LEFT.ordinal],
        mCornerRadii[CornerRadius.BOTTOM_LEFT.ordinal]
      ),
        Path.Direction.CW)
      mConvexPathInvalidated = false
    }
  }

  fun hasEqualCorners(): Boolean {
    updateCornerRadiiIfNeeded()
    val initialCornerRadius = mCornerRadii[0]
    for (cornerRadius in mCornerRadii) {
      if (initialCornerRadius != cornerRadius) {
        return false
      }
    }
    return true
  }

  fun setBorderRadius(radius: Float, position: Int): Boolean {
    if (!FloatUtil.floatsEqual(borderRadii[position], radius)) {
      borderRadii[position] = radius
      mCornerRadiiInvalidated = true
      return true
    }
    return false
  }

  private fun updateBoundsAndLayoutDirection(view: View) {

    // Update layout direction
    val layoutDirection = view.layoutDirection
    if (mLayoutDirection != layoutDirection) {
      mLayoutDirection = layoutDirection
      mCornerRadiiInvalidated = true
    }

    // Update size
    val left = 0
    val top = 0
    val right = view.width
    val bottom = view.height
    if (mBounds.left != left.toFloat() || mBounds.top != top.toFloat() || mBounds.right != right.toFloat() || mBounds.bottom != bottom.toFloat()) {
      mBounds[left.toFloat(), top.toFloat(), right.toFloat()] = bottom.toFloat()
      mCornerRadiiInvalidated = true
    }
  }

  override fun getOutline(view: View, outline: Outline) {
    updateBoundsAndLayoutDirection(view)

    // Calculate outline
    updateCornerRadiiIfNeeded()
    if (hasEqualCorners()) {
      val cornerRadius = mCornerRadii[0]
      if (cornerRadius > 0) {
        outline.setRoundRect(0, 0, mBounds.width().toInt(), mBounds.height().toInt(), cornerRadius)
      } else {
        outline.setRect(0, 0, mBounds.width().toInt(), mBounds.height().toInt())
      }
    } else {
      // Clipping is not supported when using a convex path, but drawing the elevation
      // shadow is. For the particular case, we fallback to canvas clipping in the view
      // which is supposed to call `clipCanvasIfNeeded` in its `draw` method.
      updateConvexPathIfNeeded()
      outline.setConvexPath(mConvexPath)
    }
  }

  fun clipCanvasIfNeeded(canvas: Canvas, view: View) {
    updateBoundsAndLayoutDirection(view)
    updateCornerRadiiIfNeeded()
    if (!hasEqualCorners()) {
      updateConvexPathIfNeeded()
      canvas.clipPath(mConvexPath)
    }
  }

  enum class BorderRadiusConfig {
    ALL, TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT, TOP_START, TOP_END, BOTTOM_START, BOTTOM_END
  }

  enum class CornerRadius {
    TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT
  }

  init {
    mLayoutDirection = View.LAYOUT_DIRECTION_LTR
    mBounds = RectF()
    borderRadii = FloatArray(9)
    Arrays.fill(borderRadii, YogaConstants.UNDEFINED)
    mCornerRadii = FloatArray(4)
    mCornerRadiiInvalidated = true
    mConvexPath = Path()
    mConvexPathInvalidated = true
    updateCornerRadiiIfNeeded()
  }
}