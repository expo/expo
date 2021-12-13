package devmenu.com.th3rdwave.safeareacontext;

import java.util.EnumSet;

public class SafeAreaViewLocalData {
  private EdgeInsets mInsets;
  private SafeAreaViewMode mMode;
  private EnumSet<SafeAreaViewEdges> mEdges;

  public SafeAreaViewLocalData(EdgeInsets insets, SafeAreaViewMode mode, EnumSet<SafeAreaViewEdges> edges) {
    mInsets = insets;
    mMode = mode;
    mEdges = edges;
  }

  public EdgeInsets getInsets() {
    return mInsets;
  }

  public SafeAreaViewMode getMode() {
    return mMode;
  }

  public  EnumSet<SafeAreaViewEdges> getEdges() {
    return mEdges;
  }
}
