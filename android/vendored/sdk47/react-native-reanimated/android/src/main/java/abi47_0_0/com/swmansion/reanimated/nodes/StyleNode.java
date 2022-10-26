package abi47_0_0.com.swmansion.reanimated.nodes;

import abi47_0_0.com.facebook.react.bridge.JavaOnlyMap;
import abi47_0_0.com.facebook.react.bridge.ReadableMap;
import abi47_0_0.com.facebook.react.bridge.WritableArray;
import abi47_0_0.com.facebook.react.bridge.WritableMap;
import abi47_0_0.com.swmansion.reanimated.NodesManager;
import abi47_0_0.com.swmansion.reanimated.Utils;
import java.util.Map;

public class StyleNode extends Node {

  private final Map<String, Integer> mMapping;

  public StyleNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mMapping = Utils.processMapping(config.getMap("style"));
  }

  @Override
  protected WritableMap evaluate() {
    JavaOnlyMap propMap = new JavaOnlyMap();
    for (Map.Entry<String, Integer> entry : mMapping.entrySet()) {
      Node node = mNodesManager.findNodeById(entry.getValue(), Node.class);
      if (node instanceof TransformNode) {
        propMap.putArray(entry.getKey(), (WritableArray) node.value());
      } else {
        Object val = node.value();
        if (val instanceof Double) {
          propMap.putDouble(entry.getKey(), (Double) val);
        } else if (val instanceof String) {
          propMap.putString(entry.getKey(), (String) val);
        } else {
          throw new IllegalStateException("Wrong style form");
        }
      }
    }
    return propMap;
  }
}
