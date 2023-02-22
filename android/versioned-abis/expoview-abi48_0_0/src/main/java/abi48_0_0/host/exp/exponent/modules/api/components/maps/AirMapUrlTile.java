package abi48_0_0.host.exp.exponent.modules.api.components.maps;

import android.util.Log;

import android.content.Context;

import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.TileOverlay;
import com.google.android.gms.maps.model.TileOverlayOptions;

import java.net.MalformedURLException;
import java.net.URL;

public class AirMapUrlTile extends AirMapFeature {
  protected TileOverlayOptions tileOverlayOptions;
  protected TileOverlay tileOverlay;
  protected AirMapTileProvider tileProvider;

  protected String urlTemplate;
  protected float zIndex;
  protected float maximumZ;
  protected float maximumNativeZ = 100;
  protected float minimumZ;
  protected boolean flipY = false;
  protected float tileSize = 256;
  protected boolean doubleTileSize = false;
  protected String tileCachePath;
  protected float tileCacheMaxAge;
  protected boolean offlineMode = false;
  protected float opacity = 1;
  protected Context context;
  protected boolean customTileProviderNeeded = false;

  public AirMapUrlTile(Context context) {
    super(context);
    this.context = context;
  }

  public void setUrlTemplate(String urlTemplate) {
    this.urlTemplate = urlTemplate;
    if (tileProvider != null) {
      tileProvider.setUrlTemplate(urlTemplate);
    }
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setZIndex(float zIndex) {
    this.zIndex = zIndex;
    if (tileOverlay != null) {
      tileOverlay.setZIndex(zIndex);
    }
  }

  public void setMaximumZ(float maximumZ) {
    this.maximumZ = maximumZ;
    if (tileProvider != null) {
      tileProvider.setMaximumZ((int)maximumZ);
    }
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setMaximumNativeZ(float maximumNativeZ) {
    this.maximumNativeZ = maximumNativeZ;
    if (tileProvider != null) {
      tileProvider.setMaximumNativeZ((int)maximumNativeZ);
    }
    setCustomTileProviderMode();
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setMinimumZ(float minimumZ) {
    this.minimumZ = minimumZ;
    if (tileProvider != null) {
      tileProvider.setMinimumZ((int)minimumZ);
    }
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setFlipY(boolean flipY) {
    this.flipY = flipY;
    if (tileProvider != null) {
      tileProvider.setFlipY(flipY);
    }
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setDoubleTileSize(boolean doubleTileSize) {
    this.doubleTileSize = doubleTileSize;
    if (tileProvider != null) {
      tileProvider.setDoubleTileSize(doubleTileSize);
    }
    setCustomTileProviderMode();
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setTileSize(float tileSize) {
    this.tileSize = tileSize;
    if (tileProvider != null) {
      tileProvider.setTileSize((int)tileSize);
    }
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setTileCachePath(String tileCachePath) {
    if (tileCachePath == null || tileCachePath.isEmpty()) return;
    
    try {
      URL url = new URL(tileCachePath);
      this.tileCachePath = url.getPath();
    } catch (MalformedURLException e) {
      this.tileCachePath = tileCachePath;
    } catch (Exception e) {
      return;
    }

    if (tileProvider != null) {
      tileProvider.setTileCachePath(tileCachePath);
    }
    setCustomTileProviderMode();
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setTileCacheMaxAge(float tileCacheMaxAge) {
    this.tileCacheMaxAge = tileCacheMaxAge;
    if (tileProvider != null) {
      tileProvider.setTileCacheMaxAge((int)tileCacheMaxAge);
    }
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setOfflineMode(boolean offlineMode) {
    this.offlineMode = offlineMode;
    if (tileProvider != null) {
      tileProvider.setOfflineMode(offlineMode);
    }
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setOpacity(float opacity) {
    this.opacity = opacity;
    if (tileOverlay != null) {
        tileOverlay.setTransparency(1 - opacity);
    }
  }

  public TileOverlayOptions getTileOverlayOptions() {
    if (tileOverlayOptions == null) {
      tileOverlayOptions = createTileOverlayOptions();
    }
    return tileOverlayOptions;
  }

  protected void setCustomTileProviderMode() {
    Log.d("urlTile ", "creating new mode TileProvider");
    this.customTileProviderNeeded = true;
    if (tileProvider != null) {
      tileProvider.setCustomMode();
    }
  } 

  protected TileOverlayOptions createTileOverlayOptions() {
    Log.d("urlTile ", "creating TileProvider");
    TileOverlayOptions options = new TileOverlayOptions();
    options.zIndex(zIndex);
    options.transparency(1 - this.opacity);
    this.tileProvider = new AirMapTileProvider((int)this.tileSize, this.doubleTileSize, this.urlTemplate, 
      (int)this.maximumZ, (int)this.maximumNativeZ, (int)this.minimumZ, this.flipY, this.tileCachePath, 
      (int)this.tileCacheMaxAge, this.offlineMode, this.context, this.customTileProviderNeeded);
    options.tileProvider(this.tileProvider);
    return options;
  }

  @Override
  public Object getFeature() {
    return tileOverlay;
  }

  @Override
  public void addToMap(GoogleMap map) {
    this.tileOverlay = map.addTileOverlay(getTileOverlayOptions());
  }

  @Override
  public void removeFromMap(GoogleMap map) {
    tileOverlay.remove();
  }
}
