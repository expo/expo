package abi29_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import android.util.SparseArray;

import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi29_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;
import abi29_0_0.host.exp.exponent.modules.api.reanimated.UpdateContext;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.annotation.Nullable;

public abstract class Node<T> {

  public static final Double ZERO = Double.valueOf(0);
  public static final Double ONE = Double.valueOf(1);

  protected final int mNodeID;
  protected final NodesManager mNodesManager;

  private final UpdateContext mUpdateContext;

  private long mLastLoopID = -1;
  private @Nullable T mMemoizedValue;
  private @Nullable List<Node<?>> mChildren; /* lazy-initialized when a child is added */

  public Node(int nodeID, @Nullable ReadableMap config, NodesManager nodesManager) {
    mNodeID = nodeID;
    mNodesManager = nodesManager;
    mUpdateContext = nodesManager.updateContext;
  }

  protected abstract @Nullable T evaluate();

  public final @Nullable T value() {
    if (mLastLoopID < mUpdateContext.updateLoopID) {
      mLastLoopID = mUpdateContext.updateLoopID;
      return (mMemoizedValue = evaluate());
    }
    return mMemoizedValue;
  }

  /**
   * This method will never return null. If value is null or of a different type we try to cast and
   * return 0 if we fail to properly cast the value. This is to match iOS behavior where the node
   * would not throw even if the value was not set.
   */
  public final Double doubleValue() {
    T value = value();
    if (value == null) {
      return ZERO;
    } else if (value instanceof Double) {
      return (Double) value;
    } else if (value instanceof Number) {
      return Double.valueOf(((Number) value).doubleValue());
    } else if (value instanceof Boolean) {
      return ((Boolean) value).booleanValue() ? ONE : ZERO;
    }
    throw new IllegalStateException("Value of node " + this + " cannot be cast to a number");
  }

  public void addChild(Node child) {
    if (mChildren == null) {
      mChildren = new ArrayList<>();
    }
    mChildren.add(child);
    dangerouslyRescheduleEvaluate();
  }

  public void removeChild(Node child) {
    if (mChildren != null) {
      mChildren.remove(child);
    }
  }

  protected void markUpdated() {
    UiThreadUtil.assertOnUiThread();
    mUpdateContext.updatedNodes.put(mNodeID, this);
    mNodesManager.postRunUpdatesAfterAnimation();
  }

  protected final void dangerouslyRescheduleEvaluate() {
    mLastLoopID = -1;
    markUpdated();
  }

  protected final void forceUpdateMemoizedValue(T value) {
    mMemoizedValue = value;
    markUpdated();
  }

  private static void findAndUpdateNodes(Node node, Set<Node> visitedNodes) {
    if (visitedNodes.contains(node)) {
      return;
    } else {
      visitedNodes.add(node);
    }

    List<Node> children = node.mChildren;

    if (node instanceof FinalNode) {
      ((FinalNode) node).update();
    } else if (children != null) {
      for (Node child : children) {
        findAndUpdateNodes(child, visitedNodes);
      }
    }
  }

  public static void runUpdates(UpdateContext updateContext) {
    UiThreadUtil.assertOnUiThread();

    SparseArray<Node> updatedNodes = updateContext.updatedNodes;
    for (int i = 0; i < updatedNodes.size(); i++) {
      findAndUpdateNodes(updatedNodes.valueAt(i), new HashSet<Node>());
    }

    updatedNodes.clear();
    updateContext.updateLoopID++;
  }
}
