package abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

public class CondNode extends Node {

  private final int mCondID, mIfBlockID, mElseBlockID;

  public CondNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mCondID = config.getInt("cond");
    mIfBlockID = config.hasKey("ifBlock") ? config.getInt("ifBlock") : -1;
    mElseBlockID = config.hasKey("elseBlock") ? config.getInt("elseBlock") : -1;
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
