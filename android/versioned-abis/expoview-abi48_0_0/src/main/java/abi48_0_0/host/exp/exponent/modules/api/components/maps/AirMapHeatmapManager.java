package abi48_0_0.host.exp.exponent.modules.api.components.maps;

import abi48_0_0.com.facebook.react.bridge.ReadableArray;
import abi48_0_0.com.facebook.react.bridge.ReadableMap;
import abi48_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi48_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi48_0_0.com.facebook.react.uimanager.ViewGroupManager;

import com.google.android.gms.maps.model.LatLng;
import com.google.maps.android.heatmaps.WeightedLatLng;
import com.google.maps.android.heatmaps.Gradient;


public class AirMapHeatmapManager extends ViewGroupManager<AirMapHeatmap> {

    @Override
    public String getName() {
        return "AIRMapHeatmap";
    }

    @Override
    public AirMapHeatmap createViewInstance(ThemedReactContext context) {
        return new AirMapHeatmap(context);
    }

    @ReactProp(name = "points")
    public void setPoints(AirMapHeatmap view, ReadableArray points) {
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
    public void setGradient(AirMapHeatmap view, ReadableMap gradient) {
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
    public void setOpacity(AirMapHeatmap view, double opacity) {
        view.setOpacity(opacity);
    }

    @ReactProp(name = "radius")
    public void setRadius(AirMapHeatmap view, int radius) {
        view.setRadius(radius);
    }
}