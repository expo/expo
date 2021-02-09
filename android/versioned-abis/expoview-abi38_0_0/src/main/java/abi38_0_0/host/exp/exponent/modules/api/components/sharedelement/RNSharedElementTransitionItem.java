package abi38_0_0.host.exp.exponent.modules.api.components.sharedelement;

import android.util.Log;
import android.view.View;
import android.view.ViewParent;
import android.view.ViewGroup;
import android.graphics.Rect;

class RNSharedElementTransitionItem {
  static private String LOG_TAG = "RNSharedElementTransitionItem";

  private RNSharedElementNodeManager mNodeManager;
  private String mName;
  private RNSharedElementNode mNode;
  private boolean mHidden;
  private boolean mNeedsStyle;
  private RNSharedElementStyle mStyle;
  private boolean mNeedsContent;
  private RNSharedElementContent mContent;
  private Rect mClippedLayoutCache;
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

  Rect getClippedLayout() {
    if (mClippedLayoutCache != null) return mClippedLayoutCache;
    if (mStyle == null) return null;

    View view = getView();
    View ancestorView = mNode.getAncestorView();

    // Get visible area (some parts may be clipped in a scrollview or something)
    Rect clippedLayout = new Rect(mStyle.layout);
    ViewParent parentView = view.getParent();
    int[] location = new int[2];
    Rect bounds = new Rect();
    while (parentView != null) {
      if (!(parentView instanceof ViewGroup)) break;
      ViewGroup viewGroup = (ViewGroup) parentView;
      viewGroup.getLocationOnScreen(location);

      bounds.left = location[0];
      bounds.top = location[1];
      bounds.right = location[0] + (viewGroup.getWidth());
      bounds.bottom = location[1] + (viewGroup.getHeight());

      if (viewGroup.getClipChildren()) {
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
      view = (View) parentView;
      parentView = parentView.getParent();
    }

    mClippedLayoutCache = clippedLayout;
    return clippedLayout;
  }
}
