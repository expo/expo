package devmenu.com.swmansion.reanimated;

import devmenu.com.swmansion.reanimated.nodes.Node;

import java.util.ArrayList;

public class UpdateContext {

  public long updateLoopID = 0;
  public String callID = "";
  public final ArrayList<Node> updatedNodes = new ArrayList<>();

}
