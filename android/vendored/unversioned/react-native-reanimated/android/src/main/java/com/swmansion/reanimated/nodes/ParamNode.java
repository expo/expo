package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.NodesManager;
import java.util.Stack;

public class ParamNode extends ValueNode {

  private final Stack<Integer> mArgsStack;
  private String mPrevCallID;

  public ParamNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mArgsStack = new Stack<>();
  }

  @Override
  public void setValue(Object value) {
    Node node = mNodesManager.findNodeById(mArgsStack.peek(), Node.class);
    String callID = mUpdateContext.callID;
    mUpdateContext.callID = mPrevCallID;
    ((ValueNode) node).setValue(value);
    mUpdateContext.callID = callID;
    forceUpdateMemoizedValue(value);
  }

  public void beginContext(Integer ref, String prevCallID) {
    mPrevCallID = prevCallID;
    mArgsStack.push(ref);
  }

  public void endContext() {
    mArgsStack.pop();
  }

  @Override
  protected Object evaluate() {
    String callID = mUpdateContext.callID;
    mUpdateContext.callID = mPrevCallID;
    Node node = mNodesManager.findNodeById(mArgsStack.peek(), Node.class);
    Object val = node.value();
    mUpdateContext.callID = callID;
    return val;
  }

  public void start() {
    Node node = mNodesManager.findNodeById(mArgsStack.peek(), Node.class);
    if (node instanceof ParamNode) {
      ((ParamNode) node).start();
    } else {
      ((ClockNode) node).start();
    }
  }

  public void stop() {
    Node node = mNodesManager.findNodeById(mArgsStack.peek(), Node.class);
    if (node instanceof ParamNode) {
      ((ParamNode) node).stop();
    } else {
      ((ClockNode) node).stop();
    }
  }

  public boolean isRunning() {
    Node node = mNodesManager.findNodeById(mArgsStack.peek(), Node.class);
    if (node instanceof ParamNode) {
      return ((ParamNode) node).isRunning();
    }
    return ((ClockNode) node).isRunning;
  }
}
