package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import androidx.annotation.Nullable;

import abi49_0_0.com.facebook.react.common.MapBuilder;
import abi49_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi49_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class MapCalloutManager extends ViewGroupManager<MapCallout> {

  @Override
  public String getName() {
    return "AIRMapCallout";
  }

  @Override
  public MapCallout createViewInstance(ThemedReactContext context) {
    return new MapCallout(context);
  }

  @ReactProp(name = "tooltip", defaultBoolean = false)
  public void setTooltip(MapCallout view, boolean tooltip) {
    view.setTooltip(tooltip);
  }

  @Override
  @Nullable
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of("onPress", MapBuilder.of("registrationName", "onPress"));
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    // we use a custom shadow node that emits the width/height of the view
    // after layout with the updateExtraData method. Without this, we can't generate
    // a bitmap of the appropriate width/height of the rendered view.
    return new SizeReportingShadowNode();
  }

  @Override
  public void updateExtraData(MapCallout view, Object extraData) {
    // This method is called from the shadow node with the width/height of the rendered
    // marker view.
    //noinspection unchecked
    Map<String, Float> data = (Map<String, Float>) extraData;
    float width = data.get("width");
    float height = data.get("height");
    view.width = (int) width;
    view.height = (int) height;
  }

}
