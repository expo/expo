package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi49_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp;

public class MapWMSTileManager extends ViewGroupManager<MapWMSTile> {

  public MapWMSTileManager(ReactApplicationContext reactContext) {
    super();
    DisplayMetrics metrics = new DisplayMetrics();
    ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
        .getDefaultDisplay()
        .getRealMetrics(metrics);
  }

  @Override
  public String getName() {
    return "AIRMapWMSTile";
  }

  @Override
  public MapWMSTile createViewInstance(ThemedReactContext context) {
    return new MapWMSTile(context);
  }

  @ReactProp(name = "urlTemplate")
  public void setUrlTemplate(MapWMSTile view, String urlTemplate) {
    view.setUrlTemplate(urlTemplate);
  }

  @ReactProp(name = "zIndex", defaultFloat = -1.0f)
  public void setZIndex(MapWMSTile view, float zIndex) {
    view.setZIndex(zIndex);
  }

  @ReactProp(name = "minimumZ", defaultFloat = 0.0f)
  public void setMinimumZ(MapWMSTile view, float minimumZ) {
    view.setMinimumZ(minimumZ);
  }

  @ReactProp(name = "maximumZ", defaultFloat = 100.0f)
  public void setMaximumZ(MapWMSTile view, float maximumZ) {
    view.setMaximumZ(maximumZ);
  }

  @ReactProp(name = "maximumNativeZ", defaultFloat = 100.0f)
  public void setMaximumNativeZ(MapWMSTile view, float maximumNativeZ) {
    view.setMaximumNativeZ(maximumNativeZ);
  }

  @ReactProp(name = "tileSize", defaultFloat = 256.0f)
  public void setTileSize(MapWMSTile view, float tileSize) {
    view.setTileSize(tileSize);
  }

  @ReactProp(name = "tileCachePath")
  public void setTileCachePath(MapWMSTile view, String tileCachePath) {
    view.setTileCachePath(tileCachePath);
  }

  @ReactProp(name = "tileCacheMaxAge", defaultFloat = 0.0f)
  public void setTileCacheMaxAge(MapWMSTile view, float tileCacheMaxAge) {
    view.setTileCacheMaxAge(tileCacheMaxAge);
  }

  @ReactProp(name = "offlineMode", defaultBoolean = false)
  public void setOfflineMode(MapWMSTile view, boolean offlineMode) {
    view.setOfflineMode(offlineMode);
  }

  @ReactProp(name = "opacity", defaultFloat = 1.0f)
  public void setOpacity(MapWMSTile view, float opacity) {
    view.setOpacity(opacity);
  }
}
