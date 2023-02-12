package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.swmansion.reanimated.NodesManager;
import com.swmansion.reanimated.UpdateContext;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Stack;
import javax.annotation.Nullable;

public abstract class Node {

  public static final Double ZERO = Double.valueOf(0);
  public static final Double ONE = Double.valueOf(1);

  protected final int mNodeID;
  protected final NodesManager mNodesManager;

  protected final UpdateContext mUpdateContext;

  private final Map<String, Long> mLastLoopID = new HashMap<>();
  private final Map<String, Object> mMemoizedValue = new HashMap<>();
  private @Nullable List<Node> mChildren; /* lazy-initialized when a child is added */

  public Node(int nodeID, @Nullable ReadableMap config, NodesManager nodesManager) {
    mLastLoopID.put("", -1L);
    mNodeID = nodeID;
    mNodesManager = nodesManager;
    mUpdateContext = nodesManager.updateContext;
  }

  protected abstract @Nullable Object evaluate();

  public final @Nullable Object value() {
    if (!mLastLoopID.containsKey(mUpdateContext.callID)
        || mLastLoopID.get(mUpdateContext.callID) < mUpdateContext.updateLoopID) {
      mLastLoopID.put(mUpdateContext.callID, mUpdateContext.updateLoopID);
      Object result = evaluate();
      mMemoizedValue.put(mUpdateContext.callID, result);

      return result;
    }
    return mMemoizedValue.get(mUpdateContext.callID);
  }

  /**
   * This method will never return null. If value is null or of a different type we try to cast and
   * return 0 if we fail to properly cast the value. This is to match iOS behavior where the node
   * would not throw even if the value was not set.
   */
  public final Double doubleValue() {
    Object value = value();
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
    child.dangerouslyRescheduleEvaluate();
  }

  public void removeChild(Node child) {
    if (mChildren != null) {
      mChildren.remove(child);
    }
  }

  protected void markUpdated() {
    UiThreadUtil.assertOnUiThread();
    mUpdateContext.updatedNodes.add(this);
    mNodesManager.postRunUpdatesAfterAnimation();
  }

  public void onDrop() {
    // noop
  }

  protected final void dangerouslyRescheduleEvaluate() {
    mLastLoopID.put(mUpdateContext.callID, -1L);
    markUpdated();
  }

  protected final void forceUpdateMemoizedValue(Object value) {
    mMemoizedValue.put(mUpdateContext.callID, value);
    markUpdated();
  }

  private static void findAndUpdateNodes(
      Node node, Set<Node> visitedNodes, Stack<FinalNode> finalNodes) {
    if (visitedNodes.contains(node)) {
      return;
    } else {
      visitedNodes.add(node);
    }

    List<Node> children = node.mChildren;
    if (children != null) {
      for (Node child : children) {
        findAndUpdateNodes(child, visitedNodes, finalNodes);
      }
    }
    if (node instanceof FinalNode) {
      finalNodes.push((FinalNode) node);
    }
  }

  public static void runUpdates(UpdateContext updateContext) {
    UiThreadUtil.assertOnUiThread();
    ArrayList<Node> updatedNodes = updateContext.updatedNodes;
    Set<Node> visitedNodes = new HashSet<>();
    Stack<FinalNode> finalNodes = new Stack<>();
    for (int i = 0; i < updatedNodes.size(); i++) {
      findAndUpdateNodes(updatedNodes.get(i), visitedNodes, finalNodes);
      if (i == updatedNodes.size() - 1) {
        while (!finalNodes.isEmpty()) {
          finalNodes.pop().update();
        }
      }
    }
    updatedNodes.clear();
    updateContext.updateLoopID++;
  }
}
