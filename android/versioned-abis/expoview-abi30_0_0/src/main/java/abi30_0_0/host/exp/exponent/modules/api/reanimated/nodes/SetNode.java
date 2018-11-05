package abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi30_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

public class SetNode extends Node {

  private int mWhatNodeID, mValueNodeID;

  public SetNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mWhatNodeID = config.getInt("what");
    mValueNodeID = config.getInt("value");
  }

  @Override
  protected Object evaluate() {
    Object newValue = mNodesManager.getNodeValue(mValueNodeID);
    ValueNode what = mNodesManager.findNodeById(mWhatNodeID, ValueNode.class);
    what.setValue(newValue);
    return newValue;
  }
}
