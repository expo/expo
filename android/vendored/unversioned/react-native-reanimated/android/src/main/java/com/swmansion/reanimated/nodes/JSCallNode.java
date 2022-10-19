package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.swmansion.reanimated.NodesManager;
import com.swmansion.reanimated.Utils;

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
