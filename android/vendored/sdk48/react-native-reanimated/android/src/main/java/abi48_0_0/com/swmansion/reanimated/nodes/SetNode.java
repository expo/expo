package abi48_0_0.com.swmansion.reanimated.nodes;

import abi48_0_0.com.facebook.react.bridge.ReadableMap;
import abi48_0_0.com.swmansion.reanimated.MapUtils;
import abi48_0_0.com.swmansion.reanimated.NodesManager;

public class SetNode extends Node {

  private int mWhatNodeID, mValueNodeID;

  public SetNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mWhatNodeID =
        MapUtils.getInt(
            config,
            "what",
            "Reanimated: First argument passed to set node is either of wrong type or is missing.");
    mValueNodeID =
        MapUtils.getInt(
            config,
            "value",
            "Reanimated: Second argument passed to set node is either of wrong type or is missing.");
  }

  @Override
  protected Object evaluate() {
    Object newValue = mNodesManager.getNodeValue(mValueNodeID);
    ValueNode what = mNodesManager.findNodeById(mWhatNodeID, ValueNode.class);
    what.setValue(newValue);
    return newValue;
  }
}
