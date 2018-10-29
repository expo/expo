package abi29_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

import javax.annotation.Nullable;

public class ValueNode extends Node<Double> {

  private Double mValue;

  public ValueNode(int nodeID, @Nullable ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mValue = (config != null && config.hasKey("value")) ? config.getDouble("value") : null;
  }

  public void setValue(Double value) {
    mValue = value;
    forceUpdateMemoizedValue(mValue);
  }

  @Override
  protected Double evaluate() {
    return mValue;
  }
}
