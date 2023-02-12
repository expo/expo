package abi47_0_0.host.exp.exponent.modules.api.components.sharedelement;

import java.util.ArrayList;

import android.annotation.SuppressLint;
import android.os.Build;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Color;
import android.graphics.Matrix;
import android.view.View;
import android.view.ViewGroup;

import abi47_0_0.com.facebook.react.bridge.Arguments;
import abi47_0_0.com.facebook.react.bridge.ReactContext;
import abi47_0_0.com.facebook.react.bridge.WritableMap;
import abi47_0_0.com.facebook.react.uimanager.PixelUtil;
import abi47_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

public class RNSharedElementTransition extends ViewGroup {
  // static private final String LOG_TAG = "RNSharedElementTransition";

  enum Item {
    START(0),
    END(1);

    private final int value;

    Item(final int newValue) {
      value = newValue;
    }

    public int getValue() {
      return value;
    }
  }

  private final RNSharedElementNodeManager mNodeManager;
  private RNSharedElementAnimation mAnimation = RNSharedElementAnimation.MOVE;
  private RNSharedElementResize mResize = RNSharedElementResize.STRETCH;
  private RNSharedElementAlign mAlign = RNSharedElementAlign.CENTER_CENTER;
  private float mNodePosition = 0.0f;
  private boolean mReactLayoutSet = false;
  private boolean mInitialLayoutPassCompleted = false;
  private boolean mInitialNodePositionSet = false;
  private final ArrayList<RNSharedElementTransitionItem> mItems = new ArrayList<>();
  private final int[] mParentOffset = new int[2];
  private boolean mRequiresClipping = false;
  private final RNSharedElementView mStartView;
  private final RNSharedElementView mEndView;
  private int mInitialVisibleAncestorIndex = -1;

  public RNSharedElementTransition(ThemedReactContext context, RNSharedElementNodeManager nodeManager) {
    super(context);
    mNodeManager = nodeManager;
    mItems.add(new RNSharedElementTransitionItem(nodeManager, "start"));
    mItems.add(new RNSharedElementTransitionItem(nodeManager, "end"));

    mStartView = new RNSharedElementView(context);
    addView(mStartView);

    mEndView = new RNSharedElementView(context);
    addView(mEndView);
  }

  void releaseData() {
    for (RNSharedElementTransitionItem item : mItems) {
      item.setNode(null);
    }
  }

  RNSharedElementNodeManager getNodeManager() {
    return mNodeManager;
  }

  void setItemNode(Item item, RNSharedElementNode node) {
    mItems.get(item.getValue()).setNode(node);
    requestStylesAndContent(false);
  }

  void setAnimation(final RNSharedElementAnimation animation) {
    if (mAnimation != animation) {
      mAnimation = animation;
      updateLayout();
    }
  }

  void setResize(final RNSharedElementResize resize) {
    if (mResize != resize) {
      mResize = resize;
      updateLayout();
    }
  }

  void setAlign(final RNSharedElementAlign align) {
    if (mAlign != align) {
      mAlign = align;
      updateLayout();
    }
  }

  void setNodePosition(final float nodePosition) {
    if (mNodePosition != nodePosition) {
      //Log.d(LOG_TAG, "setNodePosition " + nodePosition + ", mInitialLayoutPassCompleted: " + mInitialLayoutPassCompleted);
      mNodePosition = nodePosition;
      mInitialNodePositionSet = true;
      updateLayout();
    }
  }

  @Override
  @SuppressLint("MissingSuperCall")
  public void requestLayout() {
    // No-op, terminate `requestLayout` here, all layout is updated in the
    // `updateLayout` function
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    if (!mReactLayoutSet) {
      mReactLayoutSet = true;

      // Wait for the whole layout pass to have completed before
      // requesting the layout and content
      requestStylesAndContent(true);
      mInitialLayoutPassCompleted = true;
      updateLayout();
      updateNodeVisibility();
    }
  }

  @Override
  public boolean hasOverlappingRendering() {
    return false;
  }

  @Override
  protected void dispatchDraw(Canvas canvas) {
    //Log.d(LOG_TAG, "dispatchDraw, mRequiresClipping: " + mRequiresClipping + ", width: " + getWidth() + ", height: " + getHeight());
    if (mRequiresClipping) {
      canvas.clipRect(0, 0, getWidth(), getHeight());
    }
    super.dispatchDraw(canvas);

    // Draw content
    //Paint backgroundPaint = new Paint();
    //backgroundPaint.setColor(Color.argb(128, 255, 0, 0));
    //canvas.drawRect(0, 0, getWidth(), getHeight(), backgroundPaint);
  }

  private void requestStylesAndContent(boolean force) {
    if (!mInitialLayoutPassCompleted && !force) return;
    for (final RNSharedElementTransitionItem item : mItems) {
      if (item.getNeedsStyle()) {
        item.setNeedsStyle(false);
        item.getNode().requestStyle(args -> {
          RNSharedElementStyle style = (RNSharedElementStyle) args[0];
          item.setStyle(style);
          updateLayout();
          updateNodeVisibility();
        });
      }
      if (item.getNeedsContent()) {
        item.setNeedsContent(false);
        item.getNode().requestContent(args -> {
          RNSharedElementContent content = (RNSharedElementContent) args[0];
          item.setContent(content);
          updateLayout();
          updateNodeVisibility();
        });
      }
    }
  }

  private void updateLayout() {
    if (!mInitialLayoutPassCompleted) return;

    // Local data
    RNSharedElementTransitionItem startItem = mItems.get(Item.START.getValue());
    RNSharedElementTransitionItem endItem = mItems.get(Item.END.getValue());

    // Get parent offset
    View parent = (View) getParent();
    parent.getLocationInWindow(mParentOffset);

    // Get styles
    RNSharedElementStyle startStyle = startItem.getStyle();
    RNSharedElementStyle endStyle = endItem.getStyle();
    if ((startStyle == null) && (endStyle == null)) return;

    // Get content
    RNSharedElementContent startContent = startItem.getContent();
    RNSharedElementContent endContent = endItem.getContent();
    if ((mAnimation == RNSharedElementAnimation.MOVE) && (startContent == null) && (endContent != null)) {
      startContent = endContent;
    }

    // Determine starting scene that is currently visible to the user
    if (mInitialVisibleAncestorIndex < 0) {
      if ((startStyle != null) && (endStyle == null)) {
        mInitialVisibleAncestorIndex = (endItem.getNode() == null) ? 1 : 0;
      } else if ((endStyle != null) && (startStyle == null)) {
        mInitialVisibleAncestorIndex = (startItem.getNode() == null) ? 0 : 1;
      } else if ((startStyle != null) && (endStyle != null)) {
        float startAncestorVisibility = RNSharedElementStyle.getAncestorVisibility(parent, startStyle);
        float endAncestorVisibility = RNSharedElementStyle.getAncestorVisibility(parent, endStyle);
        mInitialVisibleAncestorIndex = endAncestorVisibility > startAncestorVisibility ? 1 : 0;
      } else {
        // Wait for both styles before deciding which ancestor is currently visible to the user
      }
    }

    // Get layout
    boolean startCompensate = mInitialVisibleAncestorIndex == 1;
    RectF startLayout = RNSharedElementStyle.normalizeLayout(startCompensate, startStyle, mParentOffset);
    Rect startFrame = (startStyle != null) ? startStyle.frame : RNSharedElementStyle.EMPTY_RECT;
    boolean endCompensate = mInitialVisibleAncestorIndex == 0;
    RectF endLayout = RNSharedElementStyle.normalizeLayout(endCompensate, endStyle, mParentOffset);
    Rect endFrame = (endStyle != null) ? endStyle.frame : RNSharedElementStyle.EMPTY_RECT;

    // Get clipped areas
    RectF startClippedLayout = RNSharedElementStyle.normalizeLayout(startCompensate, (startStyle != null) ? startItem.getClippedLayout() : RNSharedElementStyle.EMPTY_RECTF, startStyle, mParentOffset);
    RectF startClipInsets = getClipInsets(startLayout, startClippedLayout);
    RectF endClippedLayout = RNSharedElementStyle.normalizeLayout(endCompensate, (endStyle != null) ? endItem.getClippedLayout() : RNSharedElementStyle.EMPTY_RECTF, endStyle, mParentOffset);
    RectF endClipInsets = getClipInsets(endLayout, endClippedLayout);

    // Get interpolated layout
    RectF interpolatedLayout;
    RectF interpolatedClipInsets;
    RNSharedElementStyle interpolatedStyle;
    if ((startStyle != null) && (endStyle != null)) {
      interpolatedLayout = RNSharedElementStyle.getInterpolatedLayout(startLayout, endLayout, mNodePosition);
      interpolatedClipInsets = getInterpolatedClipInsets(interpolatedLayout, startClipInsets, startClippedLayout, endClipInsets, endClippedLayout, mNodePosition);
      interpolatedStyle = RNSharedElementStyle.getInterpolatedStyle(startStyle, startLayout, endStyle, endLayout, mNodePosition);
    } else if (startStyle != null) {
      interpolatedLayout = startLayout;
      interpolatedStyle = startStyle;
      interpolatedClipInsets = startClipInsets;
    } else {
      if (!mInitialNodePositionSet) {
        mNodePosition = 1.0f;
        mInitialNodePositionSet = true;
      }
      interpolatedLayout = endLayout;
      interpolatedStyle = endStyle;
      interpolatedClipInsets = endClipInsets;
    }

    // Calculate outer frame rect. Apply clipping insets if needed
    RectF parentLayout;
    if (interpolatedClipInsets.left > 0.0f || interpolatedClipInsets.top > 0.0f || interpolatedClipInsets.right > 0.0f || interpolatedClipInsets.bottom > 0.0f) {
      parentLayout = new RectF(interpolatedLayout);
      parentLayout.left += interpolatedClipInsets.left;
      parentLayout.top += interpolatedClipInsets.top;
      parentLayout.right -= interpolatedClipInsets.right;
      parentLayout.bottom -= interpolatedClipInsets.bottom;
      mRequiresClipping = true;
    } else {
      parentLayout = new RectF(startLayout);
      parentLayout.union(endLayout);
      mRequiresClipping = false;
    }

    //Log.d(LOG_TAG, "updateLayout: " + mNodePosition);

    // Update outer viewgroup layout. The outer viewgroup hosts 2 inner views
    // which draw the content & elevation. The outer viewgroup performs additional
    // clipping on these views.
    super.layout(
            -mParentOffset[0],
            -mParentOffset[1],
            (int) Math.ceil(parentLayout.width() - mParentOffset[0]),
            (int) Math.ceil(parentLayout.height() - mParentOffset[1])
    );
    setTranslationX(parentLayout.left);
    setTranslationY(parentLayout.top);

    // Determine opacity
    float startAlpha = 1.0f;
    float endAlpha = 1.0f;
    switch (mAnimation) {
      case MOVE:
        startAlpha = interpolatedStyle.opacity;
        endAlpha = (startStyle == null) ? interpolatedStyle.opacity : 0.0f;
        break;
      case FADE:
        startAlpha = ((startStyle != null) ? startStyle.opacity : 1) * (1 - mNodePosition);
        endAlpha = ((endStyle != null) ? endStyle.opacity : 1) * mNodePosition;
        break;
      case FADE_IN:
        startAlpha = 0.0f;
        endAlpha = ((endStyle != null) ? endStyle.opacity : 1) * mNodePosition;
        break;
      case FADE_OUT:
        startAlpha = ((startStyle != null) ? startStyle.opacity : 1) * (1 - mNodePosition);
        endAlpha = 0.0f;
        break;
    }

    // Render the start view
    if (mAnimation != RNSharedElementAnimation.FADE_IN) {
      mStartView.updateViewAndDrawable(
              interpolatedLayout,
              parentLayout,
              startLayout,
              startFrame,
              startContent,
              interpolatedStyle,
              startAlpha,
              mResize,
              mAlign,
              mNodePosition
      );
    }

    // Render the end view as well for the "cross-fade" animations
    if ((mAnimation == RNSharedElementAnimation.FADE)
            || (mAnimation == RNSharedElementAnimation.FADE_IN)
            || ((mAnimation == RNSharedElementAnimation.MOVE) && (startStyle == null))
    ) {
      mEndView.updateViewAndDrawable(
              interpolatedLayout,
              parentLayout,
              endLayout,
              endFrame,
              endContent,
              interpolatedStyle,
              endAlpha,
              mResize,
              mAlign,
              mNodePosition
      );

      // Also apply a fade effect on the elevation. This reduces the shadow visibility
      // underneath the view which becomes visible when the transparency of the view
      // is set. This in turn makes the shadow very visible and gives the whole view
      // a "grayish" appearance. The following code tries to reduce that visual artefact.
      if (interpolatedStyle.elevation > 0) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          mStartView.setOutlineAmbientShadowColor(Color.argb(startAlpha, 0, 0, 0));
          mStartView.setOutlineSpotShadowColor(Color.argb(startAlpha, 0, 0, 0));
          mEndView.setOutlineAmbientShadowColor(Color.argb(endAlpha, 0, 0, 0));
          mEndView.setOutlineSpotShadowColor(Color.argb(endAlpha, 0, 0, 0));
        }
      }
    } else {
      mEndView.reset();
    }

    // Fire events
    if ((startStyle != null) && !startItem.getHasCalledOnMeasure()) {
      startItem.setHasCalledOnMeasure(true);
      fireMeasureEvent("startNode", startItem, startLayout, startClippedLayout);
    }
    if ((endStyle != null) && !endItem.getHasCalledOnMeasure()) {
      endItem.setHasCalledOnMeasure(true);
      fireMeasureEvent("endNode", endItem, endLayout, endClippedLayout);
    }
  }

  private void updateNodeVisibility() {
    for (RNSharedElementTransitionItem item : mItems) {
      boolean hidden = mInitialLayoutPassCompleted
              && (item.getStyle() != null)
              && (item.getContent() != null);
      if (hidden && (mAnimation == RNSharedElementAnimation.FADE_IN) && item.getName().equals("start"))
        hidden = false;
      if (hidden && (mAnimation == RNSharedElementAnimation.FADE_OUT) && item.getName().equals("end"))
        hidden = false;
      item.setHidden(hidden);
    }
  }

  static private RectF getClipInsets(RectF layout, RectF clippedLayout) {
    return new RectF(
            clippedLayout.left - layout.left,
            clippedLayout.top - layout.top,
            layout.right - clippedLayout.right,
            layout.bottom - clippedLayout.bottom
    );
  }

  static private RectF getInterpolatedClipInsets(
          RectF interpolatedLayout,
          RectF startClipInsets,
          RectF startClippedLayout,
          RectF endClipInsets,
          RectF endClippedLayout,
          float position) {
    RectF clipInsets = new RectF();

    // Top
    if ((endClipInsets.top == 0) && (startClipInsets.top != 0) && (startClippedLayout.top <= endClippedLayout.top)) {
      clipInsets.top = Math.max(0, startClippedLayout.top - interpolatedLayout.top);
    } else if ((startClipInsets.top == 0) && (endClipInsets.top != 0) && (endClippedLayout.top <= startClippedLayout.top)) {
      clipInsets.top = Math.max(0, endClippedLayout.top - interpolatedLayout.top);
    } else {
      clipInsets.top = (startClipInsets.top + ((endClipInsets.top - startClipInsets.top) * position));
    }

    // Bottom
    if ((endClipInsets.bottom == 0) && (startClipInsets.bottom != 0) && (startClippedLayout.bottom >= endClippedLayout.bottom)) {
      clipInsets.bottom = Math.max(0, interpolatedLayout.bottom - startClippedLayout.bottom);
    } else if ((startClipInsets.bottom == 0) && (endClipInsets.bottom != 0) && (endClippedLayout.bottom >= startClippedLayout.bottom)) {
      clipInsets.bottom = Math.max(0, interpolatedLayout.bottom - endClippedLayout.bottom);
    } else {
      clipInsets.bottom = (startClipInsets.bottom + ((endClipInsets.bottom - startClipInsets.bottom) * position));
    }

    // Left
    if ((endClipInsets.left == 0) && (startClipInsets.left != 0) && (startClippedLayout.left <= endClippedLayout.left)) {
      clipInsets.left = Math.max(0, startClippedLayout.left - interpolatedLayout.left);
    } else if ((startClipInsets.left == 0) && (endClipInsets.left != 0) && (endClippedLayout.left <= startClippedLayout.left)) {
      clipInsets.left = Math.max(0, endClippedLayout.left - interpolatedLayout.left);
    } else {
      clipInsets.left = (startClipInsets.left + ((endClipInsets.left - startClipInsets.left) * position));
    }

    // Right
    if ((endClipInsets.right == 0) && (startClipInsets.right != 0) && (startClippedLayout.right >= endClippedLayout.right)) {
      clipInsets.right = Math.max(0, interpolatedLayout.right - startClippedLayout.right);
    } else if ((startClipInsets.right == 0) && (endClipInsets.right != 0) && (endClippedLayout.right >= startClippedLayout.right)) {
      clipInsets.right = Math.max(0, interpolatedLayout.right - endClippedLayout.right);
    } else {
      clipInsets.right = (startClipInsets.right + ((endClipInsets.right - startClipInsets.right) * position));
    }

    return clipInsets;
  }

  private void fireMeasureEvent(String name, RNSharedElementTransitionItem item, RectF layout, RectF clippedLayout) {
    ReactContext reactContext = (ReactContext) getContext();
    RNSharedElementStyle style = item.getStyle();
    RNSharedElementContent content = item.getContent();

    WritableMap layoutData = Arguments.createMap();
    layoutData.putDouble("x", PixelUtil.toDIPFromPixel(layout.left - mParentOffset[0]));
    layoutData.putDouble("y", PixelUtil.toDIPFromPixel(layout.top - mParentOffset[1]));
    layoutData.putDouble("width", PixelUtil.toDIPFromPixel(layout.width()));
    layoutData.putDouble("height", PixelUtil.toDIPFromPixel(layout.height()));
    layoutData.putDouble("visibleX", PixelUtil.toDIPFromPixel(clippedLayout.left - mParentOffset[0]));
    layoutData.putDouble("visibleY", PixelUtil.toDIPFromPixel(clippedLayout.top - mParentOffset[1]));
    layoutData.putDouble("visibleWidth", PixelUtil.toDIPFromPixel(clippedLayout.width()));
    layoutData.putDouble("visibleHeight", PixelUtil.toDIPFromPixel(clippedLayout.height()));
    // TODO: intrinsic content (unclipped size & position of image)
    layoutData.putDouble("contentX", PixelUtil.toDIPFromPixel(layout.left - mParentOffset[0])); // TODO
    layoutData.putDouble("contentY", PixelUtil.toDIPFromPixel(layout.top - mParentOffset[1])); // TODO
    layoutData.putDouble("contentWidth", PixelUtil.toDIPFromPixel(layout.width())); // TODO
    layoutData.putDouble("contentHeight", PixelUtil.toDIPFromPixel(layout.height())); // TODO

    WritableMap styleData = Arguments.createMap();
    styleData.putDouble("borderTopLeftRadius", PixelUtil.toDIPFromPixel(style.borderTopLeftRadius));
    styleData.putDouble("borderTopRightRadius", PixelUtil.toDIPFromPixel(style.borderTopRightRadius));
    styleData.putDouble("borderBottomLeftRadius", PixelUtil.toDIPFromPixel(style.borderBottomLeftRadius));
    styleData.putDouble("borderBottomRightRadius", PixelUtil.toDIPFromPixel(style.borderBottomRightRadius));

    WritableMap eventData = Arguments.createMap();
    eventData.putString("node", name);
    eventData.putMap("layout", layoutData);
    RNSharedElementDrawable.ViewType viewType = (content != null)
            ? RNSharedElementDrawable.getViewType(content.view, style)
            : RNSharedElementDrawable.ViewType.NONE;
    eventData.putString("contentType", viewType.getValue());
    eventData.putMap("style", styleData);

    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
            getId(),
            "onMeasureNode",
            eventData);
  }
}
