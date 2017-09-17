package abi21_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;
import android.util.TypedValue;
import android.view.MotionEvent;
import android.view.ViewGroup;

import abi21_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi21_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi21_0_0.com.facebook.react.uimanager.annotations.ReactProp;

public class RNGestureHandlerButtonViewManager extends
        ViewGroupManager<RNGestureHandlerButtonViewManager.ButtonViewGroup> {

  static class ButtonViewGroup extends ViewGroup {

    static TypedValue sResolveOutValue = new TypedValue();
    static ButtonViewGroup sResponder;

    int mBackgroundColor = Color.TRANSPARENT;
    boolean mUseForeground = false;
    boolean mUseBorderless = false;
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
        ColorDrawable colorDrawable = new ColorDrawable(mBackgroundColor);
        LayerDrawable layerDrawable = new LayerDrawable(
                new Drawable[] { colorDrawable, createSelectableDrawable() });
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
      String identifier = mUseBorderless ? "selectableItemBackgroundBorderless"
              : "selectableItemBackground";
      int attrID = getResources().getIdentifier(identifier, "attr", "android");
      Drawable drawable;
      getContext().getTheme().resolveAttribute(attrID, sResolveOutValue, true);
      final int version = Build.VERSION.SDK_INT;
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

  @Override
  protected void onAfterUpdateTransaction(ButtonViewGroup view) {
    view.updateBackground();
  }
}
