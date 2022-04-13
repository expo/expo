package versioned.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

public class AirMapUrlTileManager extends ViewGroupManager<AirMapUrlTile> {
  private DisplayMetrics metrics;

  public AirMapUrlTileManager(ReactApplicationContext reactContext) {
    super();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
      metrics = new DisplayMetrics();
      ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
          .getDefaultDisplay()
          .getRealMetrics(metrics);
    } else {
      metrics = reactContext.getResources().getDisplayMetrics();
    }
  }

  @Override
  public String getName() {
    return "AIRMapUrlTile";
  }

  @Override
  public AirMapUrlTile createViewInstance(ThemedReactContext context) {
    return new AirMapUrlTile(context);
  }

  @ReactProp(name = "urlTemplate")
  public void setUrlTemplate(AirMapUrlTile view, String urlTemplate) {
    view.setUrlTemplate(urlTemplate);
  }

  @ReactProp(name = "zIndex", defaultFloat = -1.0f)
  public void setZIndex(AirMapUrlTile view, float zIndex) {
    view.setZIndex(zIndex);
  }

  @ReactProp(name = "minimumZ", defaultFloat = 0.0f)
  public void setMinimumZ(AirMapUrlTile view, float minimumZ) {
    view.setMinimumZ(minimumZ);
  }

  @ReactProp(name = "maximumZ", defaultFloat = 100.0f)
  public void setMaximumZ(AirMapUrlTile view, float maximumZ) {
    view.setMaximumZ(maximumZ);
  }

  @ReactProp(name = "maximumNativeZ", defaultFloat = 100.0f)
  public void setMaximumNativeZ(AirMapUrlTile view, float maximumNativeZ) {
    view.setMaximumNativeZ(maximumNativeZ);
  }

  @ReactProp(name = "flipY", defaultBoolean = false)
  public void setFlipY(AirMapUrlTile view, boolean flipY) {
    view.setFlipY(flipY);
  }

  @ReactProp(name = "tileSize", defaultFloat = 256.0f)
  public void setTileSize(AirMapUrlTile view, float tileSize) {
    view.setTileSize(tileSize);
  }

  @ReactProp(name = "doubleTileSize", defaultBoolean = false)
  public void setDoubleTileSize(AirMapUrlTile view, boolean doubleTileSize) {
    view.setDoubleTileSize(doubleTileSize);
  }

  @ReactProp(name = "tileCachePath")
  public void setTileCachePath(AirMapUrlTile view, String tileCachePath) {
    view.setTileCachePath(tileCachePath);
  }

  @ReactProp(name = "tileCacheMaxAge", defaultFloat = 0.0f)
  public void setTileCacheMaxAge(AirMapUrlTile view, float tileCacheMaxAge) {
    view.setTileCacheMaxAge(tileCacheMaxAge);
  }

  @ReactProp(name = "offlineMode", defaultBoolean = false)
  public void setOfflineMode(AirMapUrlTile view, boolean offlineMode) {
    view.setOfflineMode(offlineMode);
  }

  @ReactProp(name = "opacity", defaultFloat = 1.0f)
  public void setOpacity(AirMapUrlTile view, float opacity) {
    view.setOpacity(opacity);
  }
}
