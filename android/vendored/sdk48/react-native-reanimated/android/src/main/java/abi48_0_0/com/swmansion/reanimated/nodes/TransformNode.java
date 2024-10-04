package abi48_0_0.com.swmansion.reanimated.nodes;

import abi48_0_0.com.facebook.react.bridge.JavaOnlyArray;
import abi48_0_0.com.facebook.react.bridge.JavaOnlyMap;
import abi48_0_0.com.facebook.react.bridge.ReadableArray;
import abi48_0_0.com.facebook.react.bridge.ReadableMap;
import abi48_0_0.com.facebook.react.bridge.ReadableType;
import abi48_0_0.com.facebook.react.bridge.WritableArray;
import abi48_0_0.com.swmansion.reanimated.NodesManager;
import java.util.ArrayList;
import java.util.List;

public class TransformNode extends Node {

  private abstract static class TransformConfig {
    public String propertyName;

    public abstract Object getValue(NodesManager nodesManager);
  }

  private static class AnimatedTransformConfig extends TransformConfig {
    public int nodeID;

    @Override
    public Object getValue(NodesManager nodesManager) {
      return nodesManager.getNodeValue(nodeID);
    }
  }

  private static class StaticTransformConfig extends TransformConfig {
    public Object value;

    @Override
    public Object getValue(NodesManager nodesManager) {
      return value;
    }
  }

  private static List<TransformConfig> processTransforms(ReadableArray transforms) {
    List<TransformConfig> configs = new ArrayList<>(transforms.size());
    for (int i = 0; i < transforms.size(); i++) {
      ReadableMap transformConfigMap = transforms.getMap(i);
      String property = transformConfigMap.getString("property");
      if (transformConfigMap.hasKey("nodeID")) {
        AnimatedTransformConfig transformConfig = new AnimatedTransformConfig();
        transformConfig.propertyName = property;
        transformConfig.nodeID = transformConfigMap.getInt("nodeID");
        configs.add(transformConfig);
      } else {
        StaticTransformConfig transformConfig = new StaticTransformConfig();
        transformConfig.propertyName = property;
        ReadableType type = transformConfigMap.getType("value");
        if (type == ReadableType.String) {
          transformConfig.value = transformConfigMap.getString("value");
        } else if (type == ReadableType.Array) {
          transformConfig.value = transformConfigMap.getArray("value");
        } else {
          transformConfig.value = transformConfigMap.getDouble("value");
        }
        configs.add(transformConfig);
      }
    }
    return configs;
  }

  private List<TransformConfig> mTransforms;

  public TransformNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mTransforms = processTransforms(config.getArray("transform"));
  }

  @Override
  protected WritableArray evaluate() {
    List<JavaOnlyMap> transforms = new ArrayList<>(mTransforms.size());

    for (TransformConfig transformConfig : mTransforms) {
      transforms.add(
          JavaOnlyMap.of(transformConfig.propertyName, transformConfig.getValue(mNodesManager)));
    }

    return JavaOnlyArray.from(transforms);
  }
}
