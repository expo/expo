package versioned.host.exp.exponent.modules.api.reanimated;

import versioned.host.exp.exponent.modules.api.reanimated.nodes.Node;
import java.util.ArrayList;

public class UpdateContext {

  public long updateLoopID = 0;
  public String callID = "";
  public final ArrayList<Node> updatedNodes = new ArrayList<>();
}
