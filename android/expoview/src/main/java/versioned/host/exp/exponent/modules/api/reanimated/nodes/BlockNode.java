package versioned.host.exp.exponent.modules.api.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import versioned.host.exp.exponent.modules.api.reanimated.NodesManager;
import versioned.host.exp.exponent.modules.api.reanimated.Utils;

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
