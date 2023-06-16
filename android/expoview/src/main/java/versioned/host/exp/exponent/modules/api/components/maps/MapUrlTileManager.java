package versioned.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

public class MapUrlTileManager extends ViewGroupManager<MapUrlTile> {

  public MapUrlTileManager(ReactApplicationContext reactContext) {
    super();
    DisplayMetrics metrics = new DisplayMetrics();
    ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
        .getDefaultDisplay()
        .getRealMetrics(metrics);
  }

  @Override
  public String getName() {
    return "AIRMapUrlTile";
  }

  @Override
  public MapUrlTile createViewInstance(ThemedReactContext context) {
    return new MapUrlTile(context);
  }

  @ReactProp(name = "urlTemplate")
  public void setUrlTemplate(MapUrlTile view, String urlTemplate) {
    view.setUrlTemplate(urlTemplate);
  }

  @ReactProp(name = "zIndex", defaultFloat = -1.0f)
  public void setZIndex(MapUrlTile view, float zIndex) {
    view.setZIndex(zIndex);
  }

  @ReactProp(name = "minimumZ", defaultFloat = 0.0f)
  public void setMinimumZ(MapUrlTile view, float minimumZ) {
    view.setMinimumZ(minimumZ);
  }

  @ReactProp(name = "maximumZ", defaultFloat = 100.0f)
  public void setMaximumZ(MapUrlTile view, float maximumZ) {
    view.setMaximumZ(maximumZ);
  }

  @ReactProp(name = "maximumNativeZ", defaultFloat = 100.0f)
  public void setMaximumNativeZ(MapUrlTile view, float maximumNativeZ) {
    view.setMaximumNativeZ(maximumNativeZ);
  }

  @ReactProp(name = "flipY", defaultBoolean = false)
  public void setFlipY(MapUrlTile view, boolean flipY) {
    view.setFlipY(flipY);
  }

  @ReactProp(name = "tileSize", defaultFloat = 256.0f)
  public void setTileSize(MapUrlTile view, float tileSize) {
    view.setTileSize(tileSize);
  }

  @ReactProp(name = "doubleTileSize", defaultBoolean = false)
  public void setDoubleTileSize(MapUrlTile view, boolean doubleTileSize) {
    view.setDoubleTileSize(doubleTileSize);
  }

  @ReactProp(name = "tileCachePath")
  public void setTileCachePath(MapUrlTile view, String tileCachePath) {
    view.setTileCachePath(tileCachePath);
  }

  @ReactProp(name = "tileCacheMaxAge", defaultFloat = 0.0f)
  public void setTileCacheMaxAge(MapUrlTile view, float tileCacheMaxAge) {
    view.setTileCacheMaxAge(tileCacheMaxAge);
  }

  @ReactProp(name = "offlineMode", defaultBoolean = false)
  public void setOfflineMode(MapUrlTile view, boolean offlineMode) {
    view.setOfflineMode(offlineMode);
  }

  @ReactProp(name = "opacity", defaultFloat = 1.0f)
  public void setOpacity(MapUrlTile view, float opacity) {
    view.setOpacity(opacity);
  }
}
