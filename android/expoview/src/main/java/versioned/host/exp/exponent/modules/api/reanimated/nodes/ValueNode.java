package versioned.host.exp.exponent.modules.api.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import versioned.host.exp.exponent.modules.api.reanimated.NodesManager;

public class ValueNode extends Node<Double> {

  private Double mValue;

  public ValueNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mValue = config.hasKey("value") ? config.getDouble("value") : null;
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
