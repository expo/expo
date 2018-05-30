package versioned.host.exp.exponent.modules.api.reanimated;

import android.util.SparseArray;

import versioned.host.exp.exponent.modules.api.reanimated.nodes.Node;

public class UpdateContext {

  public long updateLoopID = 0;
  public final SparseArray<Node> updatedNodes = new SparseArray<>();

}
