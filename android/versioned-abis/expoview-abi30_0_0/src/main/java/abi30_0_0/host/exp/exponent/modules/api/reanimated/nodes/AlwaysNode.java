package abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

public class AlwaysNode extends Node implements FinalNode {
  public AlwaysNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mNodeToBeEvaluated = config.getInt("what");
  }

  private int mNodeToBeEvaluated;

  @Override
  public void update() {
    this.value();
  }

  @Override
  protected Double evaluate() {
    mNodesManager.findNodeById(mNodeToBeEvaluated, Node.class).value();
    return ZERO;
  }
}
