package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.NodesManager;
import com.swmansion.reanimated.Utils;

public class CallFuncNode extends Node {

  private String mPreviousCallID;
  private final int mWhatNodeID;
  private final int[] mArgs;
  private final int[] mParams;

  public CallFuncNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mWhatNodeID = config.getInt("what");
    mParams = Utils.processIntArray(config.getArray("params"));
    mArgs = Utils.processIntArray(config.getArray("args"));
  }

  private void beginContext() {
    mPreviousCallID = mNodesManager.updateContext.callID;
    mNodesManager.updateContext.callID =
        mNodesManager.updateContext.callID + '/' + String.valueOf(mNodeID);
    for (int i = 0; i < mParams.length; i++) {
      int paramId = mParams[i];
      ParamNode paramNode = mNodesManager.findNodeById(paramId, ParamNode.class);
      paramNode.beginContext(mArgs[i], mPreviousCallID);
    }
  }

  private void endContext() {
    for (int i = 0; i < mParams.length; i++) {
      int paramId = mParams[i];
      ParamNode paramNode = mNodesManager.findNodeById(paramId, ParamNode.class);
      paramNode.endContext();
    }
    mNodesManager.updateContext.callID = mPreviousCallID;
  }

  @Override
  protected Object evaluate() {
    beginContext();
    Node whatNode = mNodesManager.findNodeById(mWhatNodeID, Node.class);
    Object retVal = whatNode.value();
    endContext();
    return retVal;
  }
}
