package versioned.host.exp.exponent.modules.api.reanimated.nodes;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import versioned.host.exp.exponent.modules.api.reanimated.NodesManager;
import versioned.host.exp.exponent.modules.api.reanimated.Utils;

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
      Node node = mNodesManager.findNodeById(entry.getValue(), Node.class);
      if (node instanceof TransformNode) {
        propMap.putArray(entry.getKey(), ((TransformNode) node).value());
      } else {
        propMap.putDouble(entry.getKey(), node.doubleValue());
      }
    }
    return propMap;
  }
}
