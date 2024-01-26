package versioned.host.exp.exponent.modules.api.components.maps;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

import com.google.android.gms.maps.model.LatLng;
import com.google.maps.android.heatmaps.WeightedLatLng;
import com.google.maps.android.heatmaps.Gradient;


public class MapHeatmapManager extends ViewGroupManager<MapHeatmap> {

    @Override
    public String getName() {
        return "AIRMapHeatmap";
    }

    @Override
    public MapHeatmap createViewInstance(ThemedReactContext context) {
        return new MapHeatmap(context);
    }

    @ReactProp(name = "points")
    public void setPoints(MapHeatmap view, ReadableArray points) {
        WeightedLatLng[] p = new WeightedLatLng[points.size()];
        for (int i = 0; i < points.size(); i++) {
            ReadableMap point = points.getMap(i);
            WeightedLatLng weightedLatLng;
            LatLng latLng = new LatLng(point.getDouble("latitude"), point.getDouble("longitude"));
            if (point.hasKey("weight")) {
                weightedLatLng = new WeightedLatLng(latLng, point.getDouble("weight"));
            } else {
                weightedLatLng = new WeightedLatLng(latLng);
            }
            p[i] = weightedLatLng;
        }
        view.setPoints(p);
    }

    @ReactProp(name = "gradient")
    public void setGradient(MapHeatmap view, ReadableMap gradient) {
        ReadableArray srcColors = gradient.getArray("colors");
        int[] colors = new int[srcColors.size()];
        for (int i = 0; i < srcColors.size(); i++) {
            colors[i] = srcColors.getInt(i);
        }

        ReadableArray srcStartPoints = gradient.getArray("startPoints");
        float[] startPoints = new float[srcStartPoints.size()];
        for (int i = 0; i < srcStartPoints.size(); i++) {
            startPoints[i] = (float)srcStartPoints.getDouble(i);
        }

        if (gradient.hasKey("colorMapSize")) {
            int colorMapSize = gradient.getInt("colorMapSize");
            view.setGradient(new Gradient(colors, startPoints, colorMapSize));
        } else {
            view.setGradient(new Gradient(colors, startPoints));
        }
    }

    @ReactProp(name = "opacity")
    public void setOpacity(MapHeatmap view, double opacity) {
        view.setOpacity(opacity);
    }

    @ReactProp(name = "radius")
    public void setRadius(MapHeatmap view, int radius) {
        view.setRadius(radius);
    }
}