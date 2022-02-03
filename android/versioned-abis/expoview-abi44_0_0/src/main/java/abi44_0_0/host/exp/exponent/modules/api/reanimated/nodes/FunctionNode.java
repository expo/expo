package abi44_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi44_0_0.com.facebook.react.bridge.ReadableMap;
import abi44_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

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
