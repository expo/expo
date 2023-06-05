package com.swmansion.gesturehandler.react

import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.graphics.drawable.LayerDrawable
import android.graphics.drawable.PaintDrawable
import android.graphics.drawable.RippleDrawable
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RectShape
import android.os.Build
import android.util.TypedValue
import android.view.MotionEvent
import android.view.View
import android.view.View.OnClickListener
import android.view.ViewGroup
import androidx.core.view.children
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.RNGestureHandlerButtonManagerDelegate
import com.facebook.react.viewmanagers.RNGestureHandlerButtonManagerInterface
import com.swmansion.gesturehandler.core.NativeViewGestureHandler
import com.swmansion.gesturehandler.react.RNGestureHandlerButtonViewManager.ButtonViewGroup

@ReactModule(name = RNGestureHandlerButtonViewManager.REACT_CLASS)
class RNGestureHandlerButtonViewManager : ViewGroupManager<ButtonViewGroup>(), RNGestureHandlerButtonManagerInterface<ButtonViewGroup> {
  private val mDelegate: ViewManagerDelegate<ButtonViewGroup>

  init {
    mDelegate = RNGestureHandlerButtonManagerDelegate<ButtonViewGroup, RNGestureHandlerButtonViewManager>(this)
  }

  override fun getName() = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext) = ButtonViewGroup(context)

  @TargetApi(Build.VERSION_CODES.M)
  @ReactProp(name = "foreground")
  override fun setForeground(view: ButtonViewGroup, useDrawableOnForeground: Boolean) {
    view.useDrawableOnForeground = useDrawableOnForeground
  }

  @ReactProp(name = "borderless")
  override fun setBorderless(view: ButtonViewGroup, useBorderlessDrawable: Boolean) {
    view.useBorderlessDrawable = useBorderlessDrawable
  }

  @ReactProp(name = "enabled")
  override fun setEnabled(view: ButtonViewGroup, enabled: Boolean) {
    view.isEnabled = enabled
  }

  @ReactProp(name = ViewProps.BORDER_RADIUS)
  override fun setBorderRadius(view: ButtonViewGroup, borderRadius: Float) {
    view.borderRadius = borderRadius
  }

  @ReactProp(name = "rippleColor")
  override fun setRippleColor(view: ButtonViewGroup, rippleColor: Int?) {
    view.rippleColor = rippleColor
  }

  @ReactProp(name = "rippleRadius")
  override fun setRippleRadius(view: ButtonViewGroup, rippleRadius: Int) {
    view.rippleRadius = rippleRadius
  }

  @ReactProp(name = "exclusive")
  override fun setExclusive(view: ButtonViewGroup, exclusive: Boolean) {
    view.exclusive = exclusive
  }

  @ReactProp(name = "touchSoundDisabled")
  override fun setTouchSoundDisabled(view: ButtonViewGroup, touchSoundDisabled: Boolean) {
    view.isSoundEffectsEnabled = !touchSoundDisabled
  }

  override fun onAfterUpdateTransaction(view: ButtonViewGroup) {
    view.updateBackground()
  }

  override fun getDelegate(): ViewManagerDelegate<ButtonViewGroup>? {
    return mDelegate
  }

  class ButtonViewGroup(context: Context?) :
    ViewGroup(context),
    NativeViewGestureHandler.NativeViewGestureHandlerHook {
    // Using object because of handling null representing no value set.
    var rippleColor: Int? = null
      set(color) = withBackgroundUpdate {
        field = color
      }

    var rippleRadius: Int? = null
      set(radius) = withBackgroundUpdate {
        field = radius
      }
    var useDrawableOnForeground = false
      set(useForeground) = withBackgroundUpdate {
        field = useForeground
      }
    var useBorderlessDrawable = false
    var borderRadius = 0f
      set(radius) = withBackgroundUpdate {
        field = radius * resources.displayMetrics.density
      }
    var exclusive = true

    private var _backgroundColor = Color.TRANSPARENT
    private var needBackgroundUpdate = false
    private var lastEventTime = -1L
    private var lastAction = -1

    var isTouched = false

    init {
      // we attach empty click listener to trigger tap sounds (see View#performClick())
      setOnClickListener(dummyClickListener)
      isClickable = true
      isFocusable = true
      needBackgroundUpdate = true
    }

    private inline fun withBackgroundUpdate(block: () -> Unit) {
      block()
      needBackgroundUpdate = true
    }

    override fun setBackgroundColor(color: Int) = withBackgroundUpdate {
      _backgroundColor = color
    }

    override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
      if (super.onInterceptTouchEvent(ev)) {
        return true
      }
      // We call `onTouchEvent` and wait until button changes state to `pressed`, if it's pressed
      // we return true so that the gesture handler can activate.
      onTouchEvent(ev)
      return isPressed
    }

    /**
     * Buttons in RN are wrapped in NativeViewGestureHandler which manages
     * calling onTouchEvent after activation of the handler. Problem is, in order to verify that
     * underlying button implementation is interested in receiving touches we have to call onTouchEvent
     * and check if button is pressed.
     *
     * This leads to invoking onTouchEvent twice which isn't idempotent in View - it calls OnClickListener
     * and plays sound effect if OnClickListener was set.
     *
     * To mitigate this behavior we use lastEventTime and lastAction variables to check that we already handled
     * the event in [onInterceptTouchEvent]. We assume here that different events
     * will have different event times or actions.
     * Events with same event time can occur on some devices for different actions.
     * (e.g. move and up in one gesture; move and cancel)
     *
     * Reference:
     * [com.swmansion.gesturehandler.NativeViewGestureHandler.onHandle]  */
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
      if (event.action == MotionEvent.ACTION_CANCEL) {
        tryFreeingResponder()
      }

      val eventTime = event.eventTime
      val action = event.action
      // always true when lastEventTime or lastAction have default value (-1)
      if (lastEventTime != eventTime || lastAction != action) {
        lastEventTime = eventTime
        lastAction = action
        return super.onTouchEvent(event)
      }
      return false
    }

    fun updateBackground() {
      if (!needBackgroundUpdate) {
        return
      }
      needBackgroundUpdate = false

      if (_backgroundColor == Color.TRANSPARENT) {
        // reset background
        background = null
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        // reset foreground
        foreground = null
      }

      val selectable = createSelectableDrawable()

      if (borderRadius != 0f) {
        // Radius-connected lines below ought to be considered
        // as a temporary solution. It do not allow to set
        // different radius on each corner. However, I suppose it's fairly
        // fine for button-related use cases.
        // Therefore it might be used as long as:
        // 1. ReactViewManager is not a generic class with a possibility to handle another ViewGroup
        // 2. There's no way to force native behavior of ReactViewGroup's superclass's onTouchEvent
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && selectable is RippleDrawable) {
          val mask = PaintDrawable(Color.WHITE)
          mask.setCornerRadius(borderRadius)
          selectable.setDrawableByLayerId(android.R.id.mask, mask)
        }
      }

      if (useDrawableOnForeground && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        foreground = selectable
        if (_backgroundColor != Color.TRANSPARENT) {
          setBackgroundColor(_backgroundColor)
        }
      } else if (_backgroundColor == Color.TRANSPARENT && rippleColor == null) {
        background = selectable
      } else {
        val colorDrawable = PaintDrawable(_backgroundColor)

        if (borderRadius != 0f) {
          colorDrawable.setCornerRadius(borderRadius)
        }

        val layerDrawable = LayerDrawable(if (selectable != null) arrayOf(colorDrawable, selectable) else arrayOf(colorDrawable))
        background = layerDrawable
      }
    }

    private fun createSelectableDrawable(): Drawable? {
      // TODO: remove once support for RN 0.63 is dropped, since 0.64 minSdkVersion is 21
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
        context.theme.resolveAttribute(android.R.attr.selectableItemBackground, resolveOutValue, true)
        @Suppress("Deprecation")
        return resources.getDrawable(resolveOutValue.resourceId)
      }

      // Since Android 13, alpha channel in RippleDrawable is clamped between [128, 255]
      // see https://github.com/aosp-mirror/platform_frameworks_base/blob/c1bd0480261460584753508327ca8a0c6fc80758/graphics/java/android/graphics/drawable/RippleDrawable.java#L1012
      if (rippleColor == Color.TRANSPARENT && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        return null
      }

      val states = arrayOf(intArrayOf(android.R.attr.state_enabled))
      val rippleRadius = rippleRadius
      val colorStateList = if (rippleColor != null) {
        val colors = intArrayOf(rippleColor!!)
        ColorStateList(states, colors)
      } else {
        // if rippleColor is null, reapply the default color
        context.theme.resolveAttribute(android.R.attr.colorControlHighlight, resolveOutValue, true)
        val colors = intArrayOf(resolveOutValue.data)
        ColorStateList(states, colors)
      }

      val drawable = RippleDrawable(
        colorStateList,
        null,
        if (useBorderlessDrawable) null else ShapeDrawable(RectShape())
      )

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && rippleRadius != null) {
        drawable.radius = PixelUtil.toPixelFromDIP(rippleRadius.toFloat()).toInt()
      }

      return drawable
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
      // No-op
    }

    override fun drawableHotspotChanged(x: Float, y: Float) {
      if (touchResponder == null || touchResponder === this) {
        super.drawableHotspotChanged(x, y)
      }
    }

    override fun canBegin(): Boolean {
      val isResponder = tryGrabbingResponder()
      if (isResponder) {
        isTouched = true
      }
      return isResponder
    }

    override fun afterGestureEnd(event: MotionEvent) {
      tryFreeingResponder()
      isTouched = false
    }

    private fun tryFreeingResponder() {
      if (touchResponder === this) {
        touchResponder = null
        soundResponder = this
      }
    }

    private fun tryGrabbingResponder(): Boolean {
      if (isChildTouched()) {
        return false
      }

      if (touchResponder == null) {
        touchResponder = this
        return true
      }
      return if (exclusive) {
        touchResponder === this
      } else {
        !(touchResponder?.exclusive ?: false)
      }
    }

    private fun isChildTouched(children: Sequence<View> = this.children): Boolean {
      for (child in children) {
        if (child is ButtonViewGroup && (child.isTouched || child.isPressed)) {
          return true
        } else if (child is ViewGroup) {
          if (isChildTouched(child.children)) {
            return true
          }
        }
      }

      return false
    }

    override fun performClick(): Boolean {
      // don't preform click when a child button is pressed (mainly to prevent sound effect of
      // a parent button from playing)
      return if (!isChildTouched() && soundResponder == this) {
        tryFreeingResponder()
        soundResponder = null
        super.performClick()
      } else {
        false
      }
    }

    override fun setPressed(pressed: Boolean) {
      // there is a possibility of this method being called before NativeViewGestureHandler has
      // opportunity to call canStart, in that case we need to grab responder in case the gesture
      // will activate
      // when canStart is called eventually, tryGrabbingResponder will return true if the button
      // already is a responder
      if (pressed) {
        if (tryGrabbingResponder()) {
          soundResponder = this
        }
      }

      // button can be pressed alongside other button if both are non-exclusive and it doesn't have
      // any pressed children (to prevent pressing the parent when children is pressed).
      val canBePressedAlongsideOther = !exclusive && touchResponder?.exclusive != true && !isChildTouched()

      if (!pressed || touchResponder === this || canBePressedAlongsideOther) {
        // we set pressed state only for current responder or any non-exclusive button when responder
        // is null or non-exclusive, assuming it doesn't have pressed children
        isTouched = pressed
        super.setPressed(pressed)
      }
      if (!pressed && touchResponder === this) {
        // if the responder is no longer pressed we release button responder
        isTouched = false
      }
    }

    override fun dispatchDrawableHotspotChanged(x: Float, y: Float) {
      // No-op
      // by default Viewgroup would pass hotspot change events
    }

    companion object {
      var resolveOutValue = TypedValue()
      var touchResponder: ButtonViewGroup? = null
      var soundResponder: ButtonViewGroup? = null
      var dummyClickListener = OnClickListener { }
    }
  }

  companion object {
    const val REACT_CLASS = "RNGestureHandlerButton"
  }
}
