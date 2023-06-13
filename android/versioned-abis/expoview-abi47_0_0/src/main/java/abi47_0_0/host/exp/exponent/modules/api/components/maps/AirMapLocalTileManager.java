package abi47_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi47_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi47_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi47_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Created by zavadpe on 30/11/2017.
 */
public class AirMapLocalTileManager extends ViewGroupManager<AirMapLocalTile> {

    public AirMapLocalTileManager(ReactApplicationContext reactContext) {
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
    public AirMapLocalTile createViewInstance(ThemedReactContext context) {
        return new AirMapLocalTile(context);
    }

    @ReactProp(name = "pathTemplate")
    public void setPathTemplate(AirMapLocalTile view, String pathTemplate) {
        view.setPathTemplate(pathTemplate);
    }

    @ReactProp(name = "tileSize", defaultFloat = 256f)
    public void setTileSize(AirMapLocalTile view, float tileSize) {
        view.setTileSize(tileSize);
    }

    @ReactProp(name = "zIndex", defaultFloat = -1.0f)
    public void setZIndex(AirMapLocalTile view, float zIndex) {
        view.setZIndex(zIndex);
    }

    @ReactProp(name = "useAssets", defaultBoolean = false)
    public void setUseAssets(AirMapLocalTile view, boolean useAssets) {
        view.setUseAssets(useAssets);
    }
}
