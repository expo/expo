package abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.Utils;

public class ConcatNode extends Node {
  private final int[] mInputIDs;

  public ConcatNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mInputIDs = Utils.processIntArray(config.getArray("input"));
  }

  @Override
  protected String evaluate() {
    StringBuilder builder = new StringBuilder();
    for (int i = 0; i < mInputIDs.length; i++) {
      Node inputNodes = mNodesManager.findNodeById(mInputIDs[i], Node.class);
      builder.append(inputNodes.value());
    }
    return builder.toString();
  }
}
