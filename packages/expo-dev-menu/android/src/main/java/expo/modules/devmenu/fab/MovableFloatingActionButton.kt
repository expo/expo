package expo.modules.devmenu.fab

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Region
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import expo.modules.devmenu.DevMenuManager
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

private const val CLICK_DRAG_TOLERANCE = 10f
private const val MARGIN = 24
private const val SIZE = 150

@SuppressLint("ViewConstructor")
class MovableFloatingActionButton(
  context: Context,
  private val updateSystemGestureExclusionRects: () -> Unit
) : FrameLayout(context), View.OnTouchListener {
  private var downRawX = 0f
  private var downRawY = 0f
  private var dX = 0f
  private var dY = 0f
  private var isActive = false

  // stencilPath is used to make the view rounded
  private val stencilPath = Path()

  // eventRegion is used to add rounded corners to the touch area
  private var eventRegion = Region()

  init {
    layoutParams = LayoutParams(SIZE, SIZE).apply {
      gravity = Gravity.BOTTOM or Gravity.END
      setMargins(MARGIN, MARGIN, MARGIN, MARGIN)
    }
    z = Float.MAX_VALUE

    setOnTouchListener(this)

    addView(View(context).apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT).apply {
        gravity = Gravity.CENTER
      }
      setBackgroundColor(Color.MAGENTA)
    })
  }

  fun onClick() {
    val reactHostWrapper = DevMenuManager.getReactHost()
                           ?: return
    val currentActivity = reactHostWrapper.currentReactContext?.currentActivity
                          ?: return

    DevMenuManager.openMenu(currentActivity)
  }

  override fun onTouch(view: View, motionEvent: MotionEvent): Boolean {
    val layoutParams = view.layoutParams as MarginLayoutParams
    val action = motionEvent.action

    when (action) {
      MotionEvent.ACTION_DOWN -> {
        if (!eventRegion.contains(motionEvent.x.toInt(), motionEvent.y.toInt())) {
          return false
        }

        downRawX = motionEvent.rawX
        downRawY = motionEvent.rawY
        dX = view.x - downRawX
        dY = view.y - downRawY
        isActive = true

        return true
      }

      MotionEvent.ACTION_MOVE, MotionEvent.ACTION_OUTSIDE -> {
        if (!isActive) {
          return false
        }

        val viewWidth = view.width
        val viewHeight = view.height

        val viewParent = view.parent as View
        val parentWidth = viewParent.width
        val parentHeight = viewParent.height

        var newX = motionEvent.rawX + dX
        newX = max(layoutParams.leftMargin.toDouble(), newX.toDouble()).toFloat()
        newX = min((parentWidth - viewWidth - layoutParams.rightMargin).toDouble(), newX.toDouble()).toFloat()

        var newY = motionEvent.rawY + dY
        newY = max(layoutParams.topMargin.toDouble(), newY.toDouble()).toFloat()
        newY = min((parentHeight - viewHeight - layoutParams.bottomMargin).toDouble(), newY.toDouble()).toFloat()

        view.animate()
          .x(newX)
          .y(newY)
          .setDuration(0)
          .start()

        return true
      }

      MotionEvent.ACTION_UP -> {
        if (!isActive) {
          return false
        }

        isActive = false

        val upRawX = motionEvent.rawX
        val upRawY = motionEvent.rawY

        val upDX = upRawX - downRawX
        val upDY = upRawY - downRawY

        return if (abs(upDX.toDouble()) < CLICK_DRAG_TOLERANCE && abs(upDY.toDouble()) < CLICK_DRAG_TOLERANCE) {
          onClick()
          true
        } else {
          val viewWidth = view.width

          val centerX = view.x + viewWidth / 2

          val viewParent = view.parent as View
          val parentWidth = viewParent.width

          val newX = if (centerX < parentWidth / 2) {
            layoutParams.leftMargin.toFloat()
          } else {
            (parentWidth - viewWidth - layoutParams.rightMargin).toFloat()
          }

          view.animate()
            .x(newX)
            .setDuration(100)
            .scaleX(1f)
            .scaleY(1f)
            .withEndAction { updateSystemGestureExclusionRects() }
            .start()

          true
        }
      }

      else -> {
        return super.onTouchEvent(motionEvent)
      }
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    // compute the path
    stencilPath.reset()
    stencilPath.addRoundRect(0f, 0f, w.toFloat(), h.toFloat(), w.toFloat(), h.toFloat(), Path.Direction.CW)
    stencilPath.close()

    val rectF = RectF()
    stencilPath.computeBounds(rectF, true)

    eventRegion = Region()
    eventRegion.setPath(stencilPath, Region((rectF.left).toInt(), (rectF.top).toInt(), (rectF.right).toInt(), (rectF.bottom).toInt()))
  }

  override fun dispatchDraw(canvas: Canvas) {
    val save = canvas.save()
    canvas.clipPath(stencilPath)
    super.dispatchDraw(canvas)
    canvas.restoreToCount(save)
  }
}
