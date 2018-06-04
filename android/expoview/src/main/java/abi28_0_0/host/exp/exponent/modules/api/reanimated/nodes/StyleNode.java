package abi28_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi28_0_0.com.facebook.react.bridge.JavaOnlyMap;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;
import abi28_0_0.host.exp.exponent.modules.api.reanimated.Utils;

import java.util.Map;

import javax.annotation.Nullable;

public class StyleNode extends Node<WritableMap> {

  private final Map<String, Integer> mMapping;

  public StyleNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mMapping = Utils.processMapping(config.getMap("style"));
  }

  @Override
  protected WritableMap evaluate() {
    JavaOnlyMap propMap = new JavaOnlyMap();
    for (Map.Entry<String, Integer> entry : mMapping.entrySet()) {
      @Nullable Node node = mNodesManager.findNodeById(entry.getValue());
      if (node == null) {
        throw new IllegalArgumentException("Mapped style node does not exists");
      } else if (node instanceof TransformNode) {
        propMap.putArray(entry.getKey(), ((TransformNode) node).value());
      } else {
        propMap.putDouble(entry.getKey(), (Double) node.value());
      }
    }
    return propMap;
  }
}
