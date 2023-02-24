package abi48_0_0.host.exp.exponent.modules.api.components.sharedelement;

// import android.util.Log;
import android.view.View;
import android.view.ViewParent;
import android.view.ViewGroup;
import android.graphics.RectF;

class RNSharedElementTransitionItem {
  // static private final String LOG_TAG = "RNSharedElementTransitionItem";

  private final RNSharedElementNodeManager mNodeManager;
  private final String mName;
  private RNSharedElementNode mNode;
  private boolean mHidden;
  private boolean mNeedsStyle;
  private RNSharedElementStyle mStyle;
  private boolean mNeedsContent;
  private RNSharedElementContent mContent;
  private RectF mClippedLayoutCache;
  private boolean mHasCalledOnMeasure;

  RNSharedElementTransitionItem(RNSharedElementNodeManager nodeManager, String name) {
    mNodeManager = nodeManager;
    mNode = null;
    mName = name;
    mHidden = false;
    mNeedsStyle = false;
    mStyle = null;
    mNeedsContent = false;
    mContent = null;
    mClippedLayoutCache = null;
    mHasCalledOnMeasure = false;
  }

  String getName() {
    return mName;
  }

  void setHidden(boolean hidden) {
    if (mHidden == hidden) return;
    mHidden = hidden;
    if (mNode == null) return;
    if (hidden) {
      mNode.addHideRef();
    } else {
      mNode.releaseHideRef();
    }
  }

  boolean getHidden() {
    return mHidden;
  }

  RNSharedElementNode getNode() {
    return mNode;
  }

  void setNode(RNSharedElementNode node) {
    if (mNode == node) {
      if (node != null) mNodeManager.release(node);
      return;
    }
    if (mNode != null) {
      if (mHidden) mNode.releaseHideRef();
      mNodeManager.release(mNode);
    }
    mNode = node;
    mNeedsStyle = node != null;
    mStyle = null;
    mNeedsContent = (node != null);
    mContent = null;
    if (mNode != null) {
      if (mHidden) mNode.addHideRef();
    }
  }

  boolean getNeedsStyle() {
    return mNeedsStyle;
  }

  void setNeedsStyle(boolean needsStyle) {
    mNeedsStyle = needsStyle;
  }

  void setStyle(RNSharedElementStyle style) {
    mStyle = style;
  }

  RNSharedElementStyle getStyle() {
    return mStyle;
  }

  boolean getNeedsContent() {
    return mNeedsContent;
  }

  void setNeedsContent(boolean needsContent) {
    mNeedsContent = needsContent;
  }

  void setContent(RNSharedElementContent content) {
    mContent = content;
  }

  RNSharedElementContent getContent() {
    return mContent;
  }

  void setHasCalledOnMeasure(boolean hasCalledOnMeasure) {
    mHasCalledOnMeasure = hasCalledOnMeasure;
  }

  boolean getHasCalledOnMeasure() {
    return mHasCalledOnMeasure;
  }

  View getView() {
    return (mNode != null) ? mNode.getResolvedView() : null;
  }

  RectF getClippedLayout() {
    if (mClippedLayoutCache != null) return mClippedLayoutCache;
    if (mStyle == null) return null;

    View ancestorView = mNode.getAncestorView();

    // Get visible area (some parts may be clipped in a scrollview or something)
    RectF clippedLayout = new RectF(mStyle.layout);
    ViewParent parentView = getView().getParent();
    RectF bounds = new RectF();
    while (parentView != null) {
      if (!(parentView instanceof ViewGroup)) break;
      ViewGroup viewGroup = (ViewGroup) parentView;

      if (viewGroup.getClipChildren()) {
        RNSharedElementStyle.getLayoutOnScreen(viewGroup, bounds);

        if (!clippedLayout.intersect(bounds)) {
          if (clippedLayout.bottom < bounds.top) {
            clippedLayout.top = bounds.top;
            clippedLayout.bottom = bounds.top;
          }
          if (clippedLayout.top > bounds.bottom) {
            clippedLayout.top = bounds.bottom;
            clippedLayout.bottom = bounds.bottom;
          }
          if (clippedLayout.right < bounds.left) {
            clippedLayout.left = bounds.left;
            clippedLayout.right = bounds.left;
          }
          if (clippedLayout.left > bounds.right) {
            clippedLayout.left = bounds.right;
            clippedLayout.right = bounds.right;
          }
          break;
        }
      }
      if (parentView == ancestorView) {
        break;
      }
      parentView = parentView.getParent();
    }

    mClippedLayoutCache = clippedLayout;
    return clippedLayout;
  }
}
