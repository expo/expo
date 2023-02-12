package abi47_0_0.com.swmansion.reanimated.nodes;

import abi47_0_0.com.facebook.react.bridge.Arguments;
import abi47_0_0.com.facebook.react.bridge.ReadableMap;
import abi47_0_0.com.facebook.react.bridge.WritableArray;
import abi47_0_0.com.facebook.react.bridge.WritableMap;
import abi47_0_0.com.swmansion.reanimated.NodesManager;
import abi47_0_0.com.swmansion.reanimated.Utils;

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
        Object value = node.value();
        if (value instanceof String) {
          args.pushString((String) value);
        } else {
          args.pushDouble(node.doubleValue());
        }
      }
    }
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("id", mNodeID);
    eventData.putArray("args", args);
    mNodesManager.sendEvent("onReanimatedCall", eventData);
    return ZERO;
  }
}
