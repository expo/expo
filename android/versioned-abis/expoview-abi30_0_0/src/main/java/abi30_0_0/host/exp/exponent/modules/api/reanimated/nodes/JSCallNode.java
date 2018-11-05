package abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi30_0_0.com.facebook.react.bridge.Arguments;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.com.facebook.react.bridge.WritableArray;
import abi30_0_0.com.facebook.react.bridge.WritableMap;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.Utils;

public class JSCallNode extends Node {

  private final int[] mInputIDs;

  public JSCallNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mInputIDs = Utils.processIntArray(config.getArray("input"));
  }

  @Override
  protected Double evaluate() {
    WritableArray args = Arguments.createArray();
    for (int i = 0; i < mInputIDs.length; i++) {
      Node node = mNodesManager.findNodeById(mInputIDs[i], Node.class);
      if (node.value() == null) {
        args.pushNull();
      } else {
        args.pushDouble(node.doubleValue());
      }
    }
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("id", mNodeID);
    eventData.putArray("args", args);
    mNodesManager.sendEvent("onReanimatedCall", eventData);
    return ZERO;
  }
}
