package abi29_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi29_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

public class SetNode extends Node<Double> {

  private int mWhatNodeID, mValueNodeID;

  public SetNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mWhatNodeID = config.getInt("what");
    mValueNodeID = config.getInt("value");
  }

  @Override
  protected Double evaluate() {
    Double newValue = mNodesManager.getNodeValue(mValueNodeID);
    ValueNode what = mNodesManager.findNodeById(mWhatNodeID, ValueNode.class);
    what.setValue(newValue);
    return newValue;
  }
}
