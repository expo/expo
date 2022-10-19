package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.NodesManager;
import com.swmansion.reanimated.Utils;
import java.text.NumberFormat;
import java.util.Locale;

public class ConcatNode extends Node {
  private final int[] mInputIDs;
  private static final NumberFormat sFormatter = NumberFormat.getInstance(Locale.ENGLISH);

  static {
    sFormatter.setMinimumFractionDigits(0);
    sFormatter.setGroupingUsed(false);
  }

  public ConcatNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mInputIDs = Utils.processIntArray(config.getArray("input"));
  }

  @Override
  protected String evaluate() {
    StringBuilder builder = new StringBuilder();
    for (int i = 0; i < mInputIDs.length; i++) {
      Node inputNodes = mNodesManager.findNodeById(mInputIDs[i], Node.class);
      Object value = inputNodes.value();
      if (value instanceof Double) {
        value = sFormatter.format((Double) value);
      }
      builder.append(value);
    }
    return builder.toString();
  }
}
