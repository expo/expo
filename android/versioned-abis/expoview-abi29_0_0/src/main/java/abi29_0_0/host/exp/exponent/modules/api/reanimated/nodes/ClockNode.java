package abi29_0_0.host.exp.exponent.modules.api.reanimated.nodes;

import android.util.Log;

import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.host.exp.exponent.modules.api.reanimated.NodesManager;

public class ClockNode extends Node<Double> implements NodesManager.OnAnimationFrame {

  public boolean isRunning;

  public ClockNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
  }

  public void start() {
    if (isRunning) {
      return;
    }
    isRunning = true;
    mNodesManager.postOnAnimation(this);
  }

  public void stop() {
    isRunning = false;
  }

  @Override
  protected Double evaluate() {
    return mNodesManager.currentFrameTimeMs;
  }

  @Override
  public void onAnimationFrame() {
    if (isRunning) {
      markUpdated();
      mNodesManager.postOnAnimation(this);
    }
  }
}
