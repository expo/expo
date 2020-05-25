package versioned.host.exp.exponent.modules.api.safeareacontext;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ViewProps;

import java.util.EnumSet;

public class SafeAreaViewShadowNode extends LayoutShadowNode {
  private EdgeInsets mInsets = new EdgeInsets(0, 0, 0, 0);
  private EnumSet<SafeAreaViewEdges> mEdges = EnumSet.noneOf(SafeAreaViewEdges.class);
  private float mPadding = Float.NaN;
  private float mPaddingVertical = Float.NaN;
  private float mPaddingHorizontal = Float.NaN;
  private float mPaddingTop = Float.NaN;
  private float mPaddingRight = Float.NaN;
  private float mPaddingBottom = Float.NaN;
  private float mPaddingLeft = Float.NaN;

  private void updateInsets() {
    float paddingTop = 0;
    float paddingRight = 0;
    float paddingBottom = 0;
    float paddingLeft = 0;

    if (!Float.isNaN(mPadding)) {
      paddingTop = mPadding;
      paddingRight = mPadding;
      paddingBottom = mPadding;
      paddingLeft = mPadding;
    }

    if (!Float.isNaN(mPaddingVertical)) {
      paddingTop = mPaddingVertical;
      paddingBottom = mPaddingVertical;
    }

    if (!Float.isNaN(mPaddingHorizontal)) {
      paddingRight = mPaddingHorizontal;
      paddingLeft = mPaddingHorizontal;
    }

    if (!Float.isNaN(mPaddingTop)) {
      paddingTop = mPaddingTop;
    }

    if (!Float.isNaN(mPaddingRight)) {
      paddingRight = mPaddingRight;
    }

    if (!Float.isNaN(mPaddingBottom)) {
      paddingBottom = mPaddingBottom;
    }

    if (!Float.isNaN(mPaddingLeft)) {
      paddingLeft = mPaddingLeft;
    }

    float insetTop = mEdges.contains(SafeAreaViewEdges.TOP) ? mInsets.top : 0;
    float insetRight = mEdges.contains(SafeAreaViewEdges.RIGHT) ? mInsets.right : 0;
    float insetBottom = mEdges.contains(SafeAreaViewEdges.BOTTOM) ? mInsets.bottom : 0;
    float insetLeft = mEdges.contains(SafeAreaViewEdges.LEFT) ? mInsets.left : 0;

    setPadding(Spacing.TOP, insetTop + paddingTop);
    setPadding(Spacing.RIGHT, insetRight + paddingRight);
    setPadding(Spacing.BOTTOM, insetBottom + paddingBottom);
    setPadding(Spacing.LEFT, insetLeft + paddingLeft);
  }

  @Override
  public void setLocalData(Object data) {
    if (data instanceof SafeAreaViewLocalData) {
      mInsets = ((SafeAreaViewLocalData) data).getInsets();
      mEdges = ((SafeAreaViewLocalData) data).getEdges();
      updateInsets();
    }
  }

  @Override
  @ReactPropGroup(
          names = {
                  ViewProps.PADDING,
                  ViewProps.PADDING_VERTICAL,
                  ViewProps.PADDING_HORIZONTAL,
                  ViewProps.PADDING_TOP,
                  ViewProps.PADDING_RIGHT,
                  ViewProps.PADDING_BOTTOM,
                  ViewProps.PADDING_LEFT,
          })
  public void setPaddings(int index, Dynamic padding) {
    float value = padding.getType() == ReadableType.Number
            ? (float)padding.asDouble()
            : Float.NaN;

    switch (index) {
      case 0:
        mPadding = value;
        break;
      case 1:
        mPaddingVertical = value;
        break;
      case 2:
        mPaddingHorizontal = value;
        break;
      case 3:
        mPaddingTop = value;
        break;
      case 4:
        mPaddingRight = value;
        break;
      case 5:
        mPaddingBottom = value;
        break;
      case 6:
        mPaddingLeft = value;
        break;
      default:
        break;
    }

    updateInsets();
  }
}
