package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.MapUtils;
import com.swmansion.reanimated.NodesManager;

public class CondNode extends Node {

  private final int mCondID, mIfBlockID, mElseBlockID;

  public CondNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mCondID =
        MapUtils.getInt(
            config,
            "cond",
            "Reanimated: First argument passed to cond node is either of wrong type or is missing.");
    mIfBlockID =
        MapUtils.getInt(
            config,
            "ifBlock",
            "Reanimated: Second argument passed to cond node is either of wrong type or is missing.");
    mElseBlockID =
        config.hasKey("elseBlock")
            ? MapUtils.getInt(
                config,
                "elseBlock",
                "Reanimated: Second argument passed to cond node is either of wrong type or is missing.")
            : -1;
  }

  @Override
  protected Object evaluate() {
    Object cond = mNodesManager.getNodeValue(mCondID);
    if (cond instanceof Number && ((Number) cond).doubleValue() != 0.0) {
      // This is not a good way to compare doubles but in this case it is what we want
      return mIfBlockID != -1 ? mNodesManager.getNodeValue(mIfBlockID) : ZERO;
    }
    return mElseBlockID != -1 ? mNodesManager.getNodeValue(mElseBlockID) : ZERO;
  }
}
