package abi44_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi44_0_0.com.facebook.react.bridge.JSApplicationCausedNativeException;
import abi44_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi44_0_0.com.facebook.react.bridge.NoSuchKeyException;
import abi44_0_0.com.facebook.react.bridge.ReadableMap;
import abi44_0_0.host.exp.exponent.modules.api.reanimated.MapUtils;
import abi44_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

public class SetNode extends Node {

  private int mWhatNodeID, mValueNodeID;

  public SetNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mWhatNodeID = MapUtils.getInt(config, "what", "Reanimated: First argument passed to set node is either of wrong type or is missing.");
    mValueNodeID = MapUtils.getInt(config, "value", "Reanimated: Second argument passed to set node is either of wrong type or is missing.");
  }

  @Override
  protected Object evaluate() {
    Object newValue = mNodesManager.getNodeValue(mValueNodeID);
    ValueNode what = mNodesManager.findNodeById(mWhatNodeID, ValueNode.class);
    what.setValue(newValue);
    return newValue;
  }
}
