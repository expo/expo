package abi48_0_0.com.swmansion.reanimated;

import abi48_0_0.com.swmansion.reanimated.nodes.Node;
import java.util.ArrayList;

public class UpdateContext {

  public long updateLoopID = 0;
  public String callID = "";
  public final ArrayList<Node> updatedNodes = new ArrayList<>();
}
