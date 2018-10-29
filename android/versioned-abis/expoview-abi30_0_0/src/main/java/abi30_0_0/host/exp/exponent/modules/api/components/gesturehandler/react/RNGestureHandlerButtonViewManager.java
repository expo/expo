package abi30_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.PaintDrawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.util.TypedValue;
import android.view.MotionEvent;
import android.view.ViewGroup;

import abi30_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi30_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi30_0_0.com.facebook.react.uimanager.ViewProps;
import abi30_0_0.com.facebook.react.uimanager.annotations.ReactProp;

public class RNGestureHandlerButtonViewManager extends
        ViewGroupManager<RNGestureHandlerButtonViewManager.ButtonViewGroup> {

  static class ButtonViewGroup extends ViewGroup {

    static TypedValue sResolveOutValue = new TypedValue();
    static ButtonViewGroup sResponder;

    int mBackgroundColor = Color.TRANSPARENT;
    boolean mUseForeground = false;
    boolean mUseBorderless = false;
    float mBorderRadius = 0;
    boolean mNeedBackgroundUpdate = false;


    public ButtonViewGroup(Context context) {
      super(context);

      setClickable(true);
      setFocusable(true);

      mNeedBackgroundUpdate = true;
    }

    @Override
    public void setBackgroundColor(int color) {
      mBackgroundColor = color;
      mNeedBackgroundUpdate = true;
    }

    public void setBorderRadius(float borderRadius) {
      mBorderRadius = borderRadius * (float)getResources().getDisplayMetrics().density;
      mNeedBackgroundUpdate = true;
    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
      if (super.onInterceptTouchEvent(ev)) {
        return true;
      }
      // We call `onTouchEvent` to and wait until button changes state to `pressed`, if it's pressed
      // we return true so that the gesture handler can activate
      onTouchEvent(ev);
      if (isPressed()) {
        return true;
      }
      return false;
    }

    private void updateBackground() {
      if (!mNeedBackgroundUpdate) {
        return;
      }
      mNeedBackgroundUpdate = false;
      if (mBackgroundColor == Color.TRANSPARENT) {
        // reset background
        setBackground(null);
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        // reset foreground
        setForeground(null);
      }
      if (mUseForeground && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        setForeground(createSelectableDrawable());
        if (mBackgroundColor != Color.TRANSPARENT) {
          setBackgroundColor(mBackgroundColor);
        }
      } else if (mBackgroundColor == Color.TRANSPARENT) {
        setBackground(createSelectableDrawable());
      } else {
        PaintDrawable colorDrawable = new PaintDrawable(mBackgroundColor);
        Drawable selectable = createSelectableDrawable();
        if (mBorderRadius != 0) {
          // Radius-connected lines below ought to be considered
          // as a temporary solution. It do not allow to set
          // different radius on each corner. However, I suppose it's fairly
          // fine for button-related use cases.
          // Therefore it might be used as long as:
          // 1. ReactViewManager is not a generic class with a possibility to handle another ViewGroup
          // 2. There's no way to force native behavior of ReactViewGroup's superclass's onTouchEvent
          colorDrawable.setCornerRadius(mBorderRadius);
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
                  && selectable instanceof RippleDrawable) {
            PaintDrawable mask = new PaintDrawable(Color.WHITE);
            mask.setCornerRadius(mBorderRadius);
            ((RippleDrawable) selectable).setDrawableByLayerId(android.R.id.mask, mask);
          }
        }
        LayerDrawable layerDrawable = new LayerDrawable(
                new Drawable[] { colorDrawable, selectable});
        setBackground(layerDrawable);
      }
    }

    public void setUseDrawableOnForeground(boolean useForeground) {
      mUseForeground = useForeground;
      mNeedBackgroundUpdate = true;
    }

    public void setUseBorderlessDrawable(boolean useBorderless) {
      mUseBorderless = useBorderless;
    }

    private Drawable createSelectableDrawable() {
      final int version = Build.VERSION.SDK_INT;
      String identifier = mUseBorderless && version >= 21 ? "selectableItemBackgroundBorderless"
              : "selectableItemBackground";
      int attrID = getResources().getIdentifier(identifier, "attr", "android");
      getContext().getTheme().resolveAttribute(attrID, sResolveOutValue, true);
      if (version >= 21) {
        return getResources().getDrawable(sResolveOutValue.resourceId, getContext().getTheme());
      } else {
        return getResources().getDrawable(sResolveOutValue.resourceId);
      }
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {
      // No-op
    }

    @Override
    public void drawableHotspotChanged(float x, float y) {
      if (sResponder == null || sResponder == this) {
        super.drawableHotspotChanged(x, y);
      }
    }

    @Override
    public void setPressed(boolean pressed) {
      if (pressed && sResponder == null) {
        // first button to be pressed grabs button responder
        sResponder = this;
      }
      if (!pressed || sResponder == this) {
        // we set pressed state only for current responder
        super.setPressed(pressed);
      }
      if (!pressed && sResponder == this) {
        // if the responder is no longer pressed we release button responder
        sResponder = null;
      }
    }

    @Override
    public void dispatchDrawableHotspotChanged(float x, float y) {
      // by default viewgroup would pass hotspot change events
    }
  }

  @Override
  public String getName() {
    return "RNGestureHandlerButton";
  }

  @Override
  public ButtonViewGroup createViewInstance(ThemedReactContext context) {
    return new ButtonViewGroup(context);
  }

  @TargetApi(Build.VERSION_CODES.M)
  @ReactProp(name = "foreground")
  public void setForeground(ButtonViewGroup view, boolean useDrawableOnForeground) {
    view.setUseDrawableOnForeground(useDrawableOnForeground);
  }

  @ReactProp(name = "borderless")
  public void setBorderless(ButtonViewGroup view, boolean useBorderlessDrawable) {
    view.setUseBorderlessDrawable(useBorderlessDrawable);
  }

  @ReactProp(name = "enabled")
  public void setEnabled(ButtonViewGroup view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = ViewProps.BORDER_RADIUS)
  public void setBorderRadius(ButtonViewGroup view, float borderRadius) {
    view.setBorderRadius(borderRadius);
  }

  @Override
  protected void onAfterUpdateTransaction(ButtonViewGroup view) {
    view.updateBackground();
  }
}
