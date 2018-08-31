package versioned.host.exp.exponent.modules.api.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import versioned.host.exp.exponent.modules.api.reanimated.NodesManager;

public abstract class ClockOpNode extends Node {

  public static class ClockStartNode extends ClockOpNode {
    public ClockStartNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
      super(nodeID, config, nodesManager);
    }

    @Override
    protected Double eval(ClockNode clock) {
      clock.start();
      return ZERO;
    }
  }

  public static class ClockStopNode extends ClockOpNode {
    public ClockStopNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
      super(nodeID, config, nodesManager);
    }

    @Override
    protected Double eval(ClockNode clock) {
      clock.stop();
      return ZERO;
    }
  }

  public static class ClockTestNode extends ClockOpNode {
    public ClockTestNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
      super(nodeID, config, nodesManager);
    }

    @Override
    protected Double eval(ClockNode clock) {
      return clock.isRunning ? 1. : 0.;
    }
  }

  private int clockID;

  public ClockOpNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    clockID = config.getInt("clock");
  }

  @Override
  protected Double evaluate() {
    ClockNode clock = mNodesManager.findNodeById(clockID, ClockNode.class);
    return eval(clock);
  }

  protected abstract Double eval(ClockNode clock);
}
