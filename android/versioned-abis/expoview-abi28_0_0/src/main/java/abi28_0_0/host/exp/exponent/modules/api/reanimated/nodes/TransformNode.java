package abi28_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi28_0_0.com.facebook.react.bridge.JavaOnlyArray;
import abi28_0_0.com.facebook.react.bridge.JavaOnlyMap;
import abi28_0_0.com.facebook.react.bridge.ReadableArray;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

import java.util.ArrayList;
import java.util.List;

public class TransformNode extends Node<WritableArray> {

  private static abstract class TransformConfig {
    public String propertyName;

    public abstract double getValue(NodesManager nodesManager);
  }

  private static class AnimatedTransformConfig extends TransformConfig {
    public int nodeID;

    @Override
    public double getValue(NodesManager nodesManager) {
      Node node = nodesManager.findNodeById(nodeID);
      if (node == null) {
        throw new IllegalArgumentException("Mapped style node does not exists");
      } else {
        return (Double) node.value();
      }
    }
  }

  private static class StaticTransformConfig extends TransformConfig {
    public double value;

    @Override
    public double getValue(NodesManager nodesManager) {
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
        transformConfig.value = transformConfigMap.getDouble("value");
        configs.add(transformConfig);
      }
    }
    return configs;
  }

  private static List<TransformConfig> mTransforms;

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
