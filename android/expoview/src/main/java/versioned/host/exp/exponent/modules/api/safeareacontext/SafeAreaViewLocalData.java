package versioned.host.exp.exponent.modules.api.safeareacontext;

import java.util.EnumSet;

public class SafeAreaViewLocalData {
  private EdgeInsets mInsets;
  private EnumSet<SafeAreaViewEdges> mEdges;

  public SafeAreaViewLocalData(EdgeInsets insets, EnumSet<SafeAreaViewEdges> edges) {
    mInsets = insets;
    mEdges = edges;
  }

  public EdgeInsets getInsets() {
    return mInsets;
  }

  public  EnumSet<SafeAreaViewEdges> getEdges() {
    return mEdges;
  }
}
