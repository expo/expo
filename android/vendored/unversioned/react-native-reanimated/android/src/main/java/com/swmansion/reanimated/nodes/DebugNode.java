package com.swmansion.reanimated.nodes;

import android.util.Log;
import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.MapUtils;
import com.swmansion.reanimated.NodesManager;

public class DebugNode extends Node {

  private final String mMessage;
  private final int mValueID;

  public DebugNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mMessage =
        MapUtils.getString(
            config,
            "message",
            "Reanimated: First argument passed to debug node is either of wrong type or is missing.");
    mValueID =
        MapUtils.getInt(
            config,
            "value",
            "Reanimated: Second argument passed to debug node is either of wrong type or is missing.");
  }

  @Override
  protected Object evaluate() {
    Object value = mNodesManager.findNodeById(mValueID, Node.class).value();
    Log.d("REANIMATED", String.format("%s %s", mMessage, value));
    return value;
  }
}
