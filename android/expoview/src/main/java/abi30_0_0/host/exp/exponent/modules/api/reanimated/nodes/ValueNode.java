package abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.com.facebook.react.bridge.ReadableType;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

import javax.annotation.Nullable;

public class ValueNode extends Node {

  private Object mValue;

  public ValueNode(int nodeID, @Nullable ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    if (config == null || !config.hasKey("value")) {
      mValue = null;
      return;
    }
    ReadableType type = config.getType("value");
    if (type == ReadableType.String) {
      mValue = config.getString("value");
    } else if (type == ReadableType.Number) {
      mValue = config.getDouble("value");
    } else if (type == ReadableType.Null) {
      mValue = null;
    } else {
      throw new IllegalStateException("Not supported value type. Must be boolean, number or string");
    }
  }

  public void setValue(Object value) {
    mValue = value;
    forceUpdateMemoizedValue(mValue);
  }

  @Override
  protected Object evaluate() {
    return mValue;
  }
}
