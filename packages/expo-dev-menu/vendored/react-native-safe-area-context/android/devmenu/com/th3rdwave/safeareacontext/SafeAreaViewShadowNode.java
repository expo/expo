package devmenu.com.th3rdwave.safeareacontext;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.NativeViewHierarchyOptimizer;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactPropGroup;

import java.util.EnumSet;

import androidx.annotation.Nullable;

public class SafeAreaViewShadowNode extends LayoutShadowNode {
  private @Nullable SafeAreaViewLocalData mLocalData;

  private float[] mPaddings;
  private float[] mMargins;
  private boolean mNeedsUpdate = false;

  public SafeAreaViewShadowNode() {
    super();

    mPaddings = new float[ViewProps.PADDING_MARGIN_SPACING_TYPES.length];
    mMargins = new float[ViewProps.PADDING_MARGIN_SPACING_TYPES.length];

    for (int i = 0; i < ViewProps.PADDING_MARGIN_SPACING_TYPES.length; i += 1) {
      mPaddings[i] = Float.NaN;
      mMargins[i] = Float.NaN;
    }
  }

  private void updateInsets() {
    if (mLocalData == null) {
      return;
    }

    float top = 0;
    float right = 0;
    float bottom = 0;
    float left = 0;

    float[] meta = mLocalData.getMode() == SafeAreaViewMode.PADDING ? mPaddings : mMargins;

    float allEdges = meta[Spacing.ALL];
    if (!Float.isNaN(allEdges)) {
      top = allEdges;
      right = allEdges;
      bottom = allEdges;
      left = allEdges;
    }

    float verticalEdges = meta[Spacing.VERTICAL];
    if (!Float.isNaN(verticalEdges)) {
      top = verticalEdges;
      bottom = verticalEdges;
    }

    float horizontalEdges = meta[Spacing.HORIZONTAL];
    if (!Float.isNaN(horizontalEdges)) {
      right = horizontalEdges;
      left = horizontalEdges;
    }

    float topEdge = meta[Spacing.TOP];
    if (!Float.isNaN(topEdge)) {
      top = topEdge;
    }

    float rightEdge = meta[Spacing.RIGHT];
    if (!Float.isNaN(rightEdge)) {
      right = rightEdge;
    }

    float bottomEdge = meta[Spacing.BOTTOM];
    if (!Float.isNaN(bottomEdge)) {
      bottom = bottomEdge;
    }

    float leftEdge = meta[Spacing.LEFT];
    if (!Float.isNaN(leftEdge)) {
      left = leftEdge;
    }

    top = PixelUtil.toPixelFromDIP(top);
    right = PixelUtil.toPixelFromDIP(right);
    bottom = PixelUtil.toPixelFromDIP(bottom);
    left = PixelUtil.toPixelFromDIP(left);

    EnumSet<SafeAreaViewEdges> edges = mLocalData.getEdges();
    EdgeInsets insets = mLocalData.getInsets();
    float insetTop = edges.contains(SafeAreaViewEdges.TOP) ? insets.top : 0;
    float insetRight = edges.contains(SafeAreaViewEdges.RIGHT) ? insets.right : 0;
    float insetBottom = edges.contains(SafeAreaViewEdges.BOTTOM) ? insets.bottom : 0;
    float insetLeft = edges.contains(SafeAreaViewEdges.LEFT) ? insets.left : 0;

    if (mLocalData.getMode() == SafeAreaViewMode.PADDING) {
      super.setPadding(Spacing.TOP, insetTop + top);
      super.setPadding(Spacing.RIGHT, insetRight + right);
      super.setPadding(Spacing.BOTTOM, insetBottom + bottom);
      super.setPadding(Spacing.LEFT, insetLeft + left);
    } else {
      super.setMargin(Spacing.TOP, insetTop + top);
      super.setMargin(Spacing.RIGHT, insetRight + right);
      super.setMargin(Spacing.BOTTOM, insetBottom + bottom);
      super.setMargin(Spacing.LEFT, insetLeft + left);
    }
  }

  private void resetInsets(SafeAreaViewMode mode) {
    if (mode == SafeAreaViewMode.PADDING) {
      super.setPadding(Spacing.TOP, mPaddings[Spacing.TOP]);
      super.setPadding(Spacing.RIGHT, mPaddings[Spacing.TOP]);
      super.setPadding(Spacing.BOTTOM, mPaddings[Spacing.BOTTOM]);
      super.setPadding(Spacing.LEFT, mPaddings[Spacing.LEFT]);
    } else {
      super.setMargin(Spacing.TOP, mMargins[Spacing.TOP]);
      super.setMargin(Spacing.RIGHT, mMargins[Spacing.TOP]);
      super.setMargin(Spacing.BOTTOM, mMargins[Spacing.BOTTOM]);
      super.setMargin(Spacing.LEFT, mMargins[Spacing.LEFT]);
    }
  }

  // The signature for onBeforeLayout is different in RN 0.59.
  // Remove when we drop support for this version and add back @Override and super call to
  // onBeforeLayout(NativeViewHierarchyOptimizer).
  public void onBeforeLayout() {
    if (mNeedsUpdate) {
      mNeedsUpdate = false;
      updateInsets();
    }
  }

  public void onBeforeLayout(NativeViewHierarchyOptimizer nativeViewHierarchyOptimizer) {
    if (mNeedsUpdate) {
      mNeedsUpdate = false;
      updateInsets();
    }
  }

  @Override
  public void setLocalData(Object data) {
    if (!(data instanceof SafeAreaViewLocalData)) {
      return;
    }

    SafeAreaViewLocalData localData = (SafeAreaViewLocalData) data;

    if (mLocalData != null && mLocalData.getMode() != localData.getMode()) {
      resetInsets(mLocalData.getMode());
    }

    mLocalData = localData;

    mNeedsUpdate = false;
    updateInsets();
  }

  // Names needs to reflect exact order in LayoutShadowNode.java
  @Override
  @ReactPropGroup(
    names = {
      ViewProps.PADDING,
      ViewProps.PADDING_VERTICAL,
      ViewProps.PADDING_HORIZONTAL,
      ViewProps.PADDING_START,
      ViewProps.PADDING_END,
      ViewProps.PADDING_TOP,
      ViewProps.PADDING_BOTTOM,
      ViewProps.PADDING_LEFT,
      ViewProps.PADDING_RIGHT,
    })
  public void setPaddings(int index, Dynamic padding) {
    int spacingType = ViewProps.PADDING_MARGIN_SPACING_TYPES[index];
    mPaddings[spacingType] = padding.getType() == ReadableType.Number ? (float) padding.asDouble() : Float.NaN;
    super.setPaddings(index, padding);
    mNeedsUpdate = true;
  }

  @Override
  @ReactPropGroup(
    names = {
      ViewProps.MARGIN,
      ViewProps.MARGIN_VERTICAL,
      ViewProps.MARGIN_HORIZONTAL,
      ViewProps.MARGIN_START,
      ViewProps.MARGIN_END,
      ViewProps.MARGIN_TOP,
      ViewProps.MARGIN_BOTTOM,
      ViewProps.MARGIN_LEFT,
      ViewProps.MARGIN_RIGHT,
    })
  public void setMargins(int index, Dynamic margin) {
    int spacingType = ViewProps.PADDING_MARGIN_SPACING_TYPES[index];
    mMargins[spacingType] = margin.getType() == ReadableType.Number ? (float) margin.asDouble() : Float.NaN;
    super.setMargins(index, margin);
    mNeedsUpdate = true;
  }
}
