package abi44_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;

import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.TileOverlay;
import com.google.android.gms.maps.model.TileOverlayOptions;
import com.google.android.gms.maps.model.UrlTileProvider;

import java.net.MalformedURLException;
import java.net.URL;

public class AirMapUrlTile extends AirMapFeature {

  class AIRMapUrlTileProvider extends UrlTileProvider {
    private String urlTemplate;

    public AIRMapUrlTileProvider(int width, int height, String urlTemplate) {
      super(width, height);
      this.urlTemplate = urlTemplate;
    }

    @Override
    public synchronized URL getTileUrl(int x, int y, int zoom) {

      if (AirMapUrlTile.this.flipY == true) {
        y = (1 << zoom) - y - 1;
      }

      String s = this.urlTemplate
          .replace("{x}", Integer.toString(x))
          .replace("{y}", Integer.toString(y))
          .replace("{z}", Integer.toString(zoom));
      URL url = null;

      if(AirMapUrlTile.this.maximumZ > 0 && zoom > maximumZ) {
        return url;
      }

      if(AirMapUrlTile.this.minimumZ > 0 && zoom < minimumZ) {
        return url;
      }

      try {
        url = new URL(s);
      } catch (MalformedURLException e) {
        throw new AssertionError(e);
      }
      return url;
    }

    public void setUrlTemplate(String urlTemplate) {
      this.urlTemplate = urlTemplate;
    }
  }

  private TileOverlayOptions tileOverlayOptions;
  private TileOverlay tileOverlay;
  private AIRMapUrlTileProvider tileProvider;

  private String urlTemplate;
  private float zIndex;
  private float maximumZ;
  private float minimumZ;
  private boolean flipY;

  public AirMapUrlTile(Context context) {
    super(context);
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
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setMinimumZ(float minimumZ) {
    this.minimumZ = minimumZ;
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public void setFlipY(boolean flipY) {
    this.flipY = flipY;
    if (tileOverlay != null) {
      tileOverlay.clearTileCache();
    }
  }

  public TileOverlayOptions getTileOverlayOptions() {
    if (tileOverlayOptions == null) {
      tileOverlayOptions = createTileOverlayOptions();
    }
    return tileOverlayOptions;
  }

  private TileOverlayOptions createTileOverlayOptions() {
    TileOverlayOptions options = new TileOverlayOptions();
    options.zIndex(zIndex);
    this.tileProvider = new AIRMapUrlTileProvider(256, 256, this.urlTemplate);
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
