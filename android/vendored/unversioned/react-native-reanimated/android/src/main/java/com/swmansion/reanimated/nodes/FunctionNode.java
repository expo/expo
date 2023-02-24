package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.NodesManager;

public class FunctionNode extends Node {

  private final int mWhatNodeID;

  public FunctionNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mWhatNodeID = config.getInt("what");
  }

  @Override
  protected Object evaluate() {
    Node what = mNodesManager.findNodeById(mWhatNodeID, Node.class);
    return what.value();
  }
}
