package devmenu.com.th3rdwave.safeareacontext;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewManager;

import java.util.EnumSet;

public class SafeAreaViewManager extends ReactViewManager {
  public SafeAreaViewManager() {
    super();
  }

  @Override
  @NonNull
  public String getName() {
    return "RNCSafeAreaView";
  }

  @Override
  @NonNull
  public SafeAreaView createViewInstance(@NonNull ThemedReactContext context) {
    return new SafeAreaView(context);
  }

  @Override
  @NonNull
  public SafeAreaViewShadowNode createShadowNodeInstance() {
    return new SafeAreaViewShadowNode();
  }

  @Override
  public Class<? extends LayoutShadowNode> getShadowNodeClass() {
    return SafeAreaViewShadowNode.class;
  }

  @ReactProp(name = "mode")
  public void setMode(SafeAreaView view, @Nullable String mode) {
    if ("padding".equals(mode)) {
      view.setMode(SafeAreaViewMode.PADDING);
    } else if ("margin".equals(mode)) {
      view.setMode(SafeAreaViewMode.MARGIN);
    }
  }

  @ReactProp(name = "edges")
  public void setEdges(SafeAreaView view, @Nullable ReadableArray propList) {
    EnumSet<SafeAreaViewEdges> edges = EnumSet.noneOf(SafeAreaViewEdges.class);

    if (propList != null) {
      for (int i = 0; i < propList.size(); i += 1) {
        String edgeName = propList.getString(i);
        if ("top".equals(edgeName)) {
          edges.add(SafeAreaViewEdges.TOP);
        } else if ("right".equals(edgeName)) {
          edges.add(SafeAreaViewEdges.RIGHT);
        } else if ("bottom".equals(edgeName)) {
          edges.add(SafeAreaViewEdges.BOTTOM);
        } else if ("left".equals(edgeName)) {
          edges.add(SafeAreaViewEdges.LEFT);
        }
      }
    }

    view.setEdges(edges);
  }
}
