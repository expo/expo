package com.swmansion.reanimated;

import com.swmansion.reanimated.nodes.Node;
import java.util.ArrayList;

public class UpdateContext {

  public long updateLoopID = 0;
  public String callID = "";
  public final ArrayList<Node> updatedNodes = new ArrayList<>();
}
