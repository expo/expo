package devmenu.com.swmansion.gesturehandler.react

import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.graphics.drawable.LayerDrawable
import android.graphics.drawable.PaintDrawable
import android.graphics.drawable.RippleDrawable
import android.os.Build
import android.util.TypedValue
import android.view.MotionEvent
import android.view.View
import android.view.View.OnClickListener
import android.view.ViewGroup
import androidx.core.view.children
import com.facebook.react.bridge.SoftAssertions
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import devmenu.com.swmansion.gesturehandler.NativeViewGestureHandler
import devmenu.com.swmansion.gesturehandler.react.RNGestureHandlerButtonViewManager.ButtonViewGroup
import expo.modules.devmenu.R

class RNGestureHandlerButtonViewManager : ViewGroupManager<ButtonViewGroup>() {
  override fun getName() = "RNGestureHandlerButton"

  public override fun createViewInstance(context: ThemedReactContext) = ButtonViewGroup(context)

  @TargetApi(Build.VERSION_CODES.M)
  @ReactProp(name = "foreground")
  fun setForeground(view: ButtonViewGroup, useDrawableOnForeground: Boolean) {
    view.useDrawableOnForeground = useDrawableOnForeground
  }

  @ReactProp(name = "borderless")
  fun setBorderless(view: ButtonViewGroup, useBorderlessDrawable: Boolean) {
    view.useBorderlessDrawable = useBorderlessDrawable
  }

  @ReactProp(name = "enabled")
  fun setEnabled(view: ButtonViewGroup, enabled: Boolean) {
    view.isEnabled = enabled
  }

  @ReactProp(name = ViewProps.BORDER_RADIUS)
  override fun setBorderRadius(view: ButtonViewGroup, borderRadius: Float) {
    view.borderRadius = borderRadius
  }

  @ReactProp(name = "rippleColor")
  fun setRippleColor(view: ButtonViewGroup, rippleColor: Int?) {
    view.rippleColor = rippleColor
  }

  @ReactProp(name = "rippleRadius")
  fun setRippleRadius(view: ButtonViewGroup, rippleRadius: Int?) {
    view.rippleRadius = rippleRadius
  }

  @ReactProp(name = "exclusive")
  fun setExclusive(view: ButtonViewGroup, exclusive: Boolean = true) {
    view.exclusive = exclusive
  }

  override fun onAfterUpdateTransaction(view: ButtonViewGroup) {
    view.updateBackground()
  }

  class ButtonViewGroup(context: Context?) : ViewGroup(context),
    NativeViewGestureHandler.StateChangeHook {
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

    private fun applyRippleEffectWhenNeeded(selectable: Drawable): Drawable {
      val rippleColor = rippleColor
      if (rippleColor != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && selectable is RippleDrawable) {
        val states = arrayOf(intArrayOf(android.R.attr.state_enabled))
        val colors = intArrayOf(rippleColor)
        val colorStateList = ColorStateList(states, colors)
        selectable.setColor(colorStateList)
      }

      val rippleRadius = rippleRadius
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && rippleRadius != null && selectable is RippleDrawable) {
        selectable.radius = PixelUtil.toPixelFromDIP(rippleRadius.toFloat()).toInt()
      }
      return selectable
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
     * [devmenu.com.swmansion.gesturehandler.NativeViewGestureHandler.onHandle]  */
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
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
      if (useDrawableOnForeground && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        foreground = applyRippleEffectWhenNeeded(createSelectableDrawable())
        if (_backgroundColor != Color.TRANSPARENT) {
          setBackgroundColor(_backgroundColor)
        }
      } else if (_backgroundColor == Color.TRANSPARENT && rippleColor == null) {
        background = createSelectableDrawable()
      } else {
        val colorDrawable = PaintDrawable(_backgroundColor)
        val selectable = createSelectableDrawable()
        if (borderRadius != 0f) {
          // Radius-connected lines below ought to be considered
          // as a temporary solution. It do not allow to set
          // different radius on each corner. However, I suppose it's fairly
          // fine for button-related use cases.
          // Therefore it might be used as long as:
          // 1. ReactViewManager is not a generic class with a possibility to handle another ViewGroup
          // 2. There's no way to force native behavior of ReactViewGroup's superclass's onTouchEvent
          colorDrawable.setCornerRadius(borderRadius)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
            && selectable is RippleDrawable) {
            val mask = PaintDrawable(Color.WHITE)
            mask.setCornerRadius(borderRadius)
            selectable.setDrawableByLayerId(android.R.id.mask, mask)
          }
        }
        applyRippleEffectWhenNeeded(selectable)
        val layerDrawable = LayerDrawable(arrayOf(colorDrawable, selectable))
        background = layerDrawable
      }
    }

    private fun createSelectableDrawable(): Drawable {
      val version = Build.VERSION.SDK_INT
      val identifier = if (useBorderlessDrawable && version >= 21) SELECTABLE_ITEM_BACKGROUND_BORDERLESS else SELECTABLE_ITEM_BACKGROUND
      val attrID = getAttrId(context, identifier)
      context.theme.resolveAttribute(attrID, resolveOutValue, true)
      return if (version >= 21) {
        resources.getDrawable(resolveOutValue.resourceId, context.theme)
      } else {
        @Suppress("Deprecation")
        resources.getDrawable(resolveOutValue.resourceId)
      }
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
      // No-op
    }

    override fun drawableHotspotChanged(x: Float, y: Float) {
      if (responder == null || responder === this) {
        super.drawableHotspotChanged(x, y)
      }
    }

    override fun canStart(): Boolean {
      val isResponder = tryGrabbingResponder()
      if (isResponder) {
        isTouched = true
      }
      return isResponder
    }

    override fun afterGestureEnd() {
      tryFreeingResponder()
      isTouched = false
    }

    private fun tryGrabbingResponder(): Boolean {
      if (isChildTouched()) {
        return false
      }

      if (responder == null) {
        responder = this
        return true
      }
      return if (exclusive) {
        responder === this
      } else {
        !(responder?.exclusive ?: false)
      }
    }

    private fun tryFreeingResponder() {
      if (responder === this) {
        responder = null
      }
    }

    private fun isChildTouched(children: Sequence<View> = this.children): Boolean {
      for (child in children) {
        if (child is ButtonViewGroup && (child.isTouched || child.isPressed)) {
          return true
        } else if (child is ViewGroup) {
          return isChildTouched(child.children)
        }
      }

      return false
    }

    override fun setPressed(pressed: Boolean) {
      // there is a possibility of this method being called before NativeViewGestureHandler has
      // opportunity to call canStart, in that case we need to grab responder in case the gesture
      // will activate
      // when canStart is called eventually, tryGrabbingResponder will return true if the button
      // already is a responder
      if (pressed) {
        tryGrabbingResponder()
      }

      // button can be pressed alongside other button if both are non-exclusive and it doesn't have
      // any pressed children (to prevent pressing the parent when children is pressed).
      val canBePressedAlongsideOther = !exclusive && responder?.exclusive != true && !isChildTouched()

      if (!pressed || responder === this || canBePressedAlongsideOther) {
        // we set pressed state only for current responder or any non-exclusive button when responder
        // is null or non-exclusive, assuming it doesn't have pressed children
        super.setPressed(pressed)
        isTouched = pressed
      }
      if (!pressed && responder === this) {
        // if the responder is no longer pressed we release button responder
        responder = null
      }
    }

    override fun dispatchDrawableHotspotChanged(x: Float, y: Float) {
      // No-op
      // by default Viewgroup would pass hotspot change events
    }

    companion object {
      const val SELECTABLE_ITEM_BACKGROUND = "selectableItemBackground"
      const val SELECTABLE_ITEM_BACKGROUND_BORDERLESS = "selectableItemBackgroundBorderless"

      var resolveOutValue = TypedValue()
      var responder: ButtonViewGroup? = null
      var dummyClickListener = OnClickListener { }

      @TargetApi(Build.VERSION_CODES.LOLLIPOP)
      private fun getAttrId(context: Context, attr: String): Int {
        SoftAssertions.assertNotNull(attr)
        return when (attr) {
          SELECTABLE_ITEM_BACKGROUND -> {
            R.attr.selectableItemBackground
          }
          SELECTABLE_ITEM_BACKGROUND_BORDERLESS -> {
            R.attr.selectableItemBackgroundBorderless
          }
          else -> {
            context.resources.getIdentifier(attr, "attr", "android")
          }
        }
      }
    }
  }
}
