package abi48_0_0.host.exp.exponent.modules.api.components.sharedelement;

import java.util.Map;
import java.util.HashMap;

import android.view.View;
import android.content.Context;

import abi48_0_0.com.facebook.react.bridge.ReadableMap;
import abi48_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager;

class RNSharedElementNodeManager {
  private final Map<Integer, RNSharedElementNode> mNodes = new HashMap<>();
  private NativeViewHierarchyManager mNativeViewHierarchyManager;
  private final Context mContext;

  RNSharedElementNodeManager(Context context) {
    mContext = context;
  }

  void setNativeViewHierarchyManager(NativeViewHierarchyManager nativeViewHierarchyManager) {
    mNativeViewHierarchyManager = nativeViewHierarchyManager;
  }

  NativeViewHierarchyManager getNativeViewHierarchyManager() {
    return mNativeViewHierarchyManager;
  }

  RNSharedElementNode acquire(int reactTag, View view, boolean isParent, View ancestor, ReadableMap styleConfig) {
    synchronized (mNodes) {
      RNSharedElementNode node = mNodes.get(reactTag);
      if (node != null) {
        node.addRef();
        return node;
      }
      node = new RNSharedElementNode(mContext, reactTag, view, isParent, ancestor, styleConfig);
      mNodes.put(reactTag, node);
      return node;
    }
  }

  int release(RNSharedElementNode node) {
    synchronized (mNodes) {
      int refCount = node.releaseRef();
      if (refCount == 0) {
        mNodes.remove(node.getReactTag());
      }
      return refCount;
    }
  }
}