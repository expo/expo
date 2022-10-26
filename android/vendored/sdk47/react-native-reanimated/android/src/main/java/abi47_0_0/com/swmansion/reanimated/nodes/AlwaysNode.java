package abi47_0_0.com.swmansion.reanimated.nodes;

import abi47_0_0.com.facebook.react.bridge.ReadableMap;
import abi47_0_0.com.swmansion.reanimated.MapUtils;
import abi47_0_0.com.swmansion.reanimated.NodesManager;

public class AlwaysNode extends Node implements FinalNode {
  public AlwaysNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mNodeToBeEvaluated =
        MapUtils.getInt(
            config,
            "what",
            "Reanimated: Argument passed to always node is either of wrong type or is missing.");
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
