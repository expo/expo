package abi28_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;
import abi28_0_0.host.exp.exponent.modules.api.reanimated.Utils;

public class JSCallNode extends Node<Double> {

  private static final Double ZERO = new Double(0);

  private final int[] mInputIDs;

  public JSCallNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mInputIDs = Utils.processIntArray(config.getArray("input"));
  }

  @Override
  protected Double evaluate() {
    WritableArray args = Arguments.createArray();
    for (int i = 0; i < mInputIDs.length; i++) {
      Object val = mNodesManager.findNodeById(mInputIDs[i]).value();
      if (val == null) {
        args.pushNull();
      } else {
        args.pushDouble((Double) val);
      }
    }
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("id", mNodeID);
    eventData.putArray("args", args);
    mNodesManager.sendEvent("onReanimatedCall", eventData);
    return ZERO;
  }
}
