package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.NodesManager;
import com.swmansion.reanimated.Utils;

public class BlockNode extends Node {

  private final int[] mBlock;

  public BlockNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mBlock = Utils.processIntArray(config.getArray("block"));
  }

  @Override
  protected Object evaluate() {
    Object res = null;
    for (int i = 0; i < mBlock.length; i++) {
      res = mNodesManager.findNodeById(mBlock[i], Node.class).value();
    }
    return res;
  }
}
