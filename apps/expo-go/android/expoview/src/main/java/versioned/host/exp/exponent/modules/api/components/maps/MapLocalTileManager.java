package versioned.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Created by zavadpe on 30/11/2017.
 */
public class MapLocalTileManager extends ViewGroupManager<MapLocalTile> {

    public MapLocalTileManager(ReactApplicationContext reactContext) {
        super();
        DisplayMetrics metrics = new DisplayMetrics();
        ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
                .getDefaultDisplay()
                .getRealMetrics(metrics);
    }

    @Override
    public String getName() {
        return "AIRMapLocalTile";
    }

    @Override
    public MapLocalTile createViewInstance(ThemedReactContext context) {
        return new MapLocalTile(context);
    }

    @ReactProp(name = "pathTemplate")
    public void setPathTemplate(MapLocalTile view, String pathTemplate) {
        view.setPathTemplate(pathTemplate);
    }

    @ReactProp(name = "tileSize", defaultFloat = 256f)
    public void setTileSize(MapLocalTile view, float tileSize) {
        view.setTileSize(tileSize);
    }

    @ReactProp(name = "zIndex", defaultFloat = -1.0f)
    public void setZIndex(MapLocalTile view, float zIndex) {
        view.setZIndex(zIndex);
    }

    @ReactProp(name = "useAssets", defaultBoolean = false)
    public void setUseAssets(MapLocalTile view, boolean useAssets) {
        view.setUseAssets(useAssets);
    }
}
