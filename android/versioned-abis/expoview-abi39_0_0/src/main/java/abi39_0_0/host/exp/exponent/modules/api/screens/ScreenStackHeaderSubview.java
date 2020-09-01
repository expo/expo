package abi39_0_0.host.exp.exponent.modules.api.screens;

import android.view.View;
import android.view.ViewParent;

import abi39_0_0.com.facebook.react.bridge.ReactContext;
import abi39_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi39_0_0.com.facebook.react.views.view.ReactViewGroup;

public class ScreenStackHeaderSubview extends ReactViewGroup {

  public enum Type {
    LEFT,
    CENTER,
    RIGHT,
    BACK
  }

  private int mReactWidth, mReactHeight;

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    if (MeasureSpec.getMode(widthMeasureSpec) == MeasureSpec.EXACTLY &&
            MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY) {
      // dimensions provided by react
      mReactWidth = MeasureSpec.getSize(widthMeasureSpec);
      mReactHeight = MeasureSpec.getSize(heightMeasureSpec);
      ViewParent parent = getParent();
      if (parent != null) {
        forceLayout();
        ((View) parent).requestLayout();
      }
    }
    setMeasuredDimension(mReactWidth, mReactHeight);
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    // no-op
  }

  private Type mType = Type.RIGHT;

  public ScreenStackHeaderSubview(ReactContext context) {
    super(context);
  }

  public void setType(Type type) {
    mType = type;
  }

  public Type getType() {
    return mType;
  }
}
