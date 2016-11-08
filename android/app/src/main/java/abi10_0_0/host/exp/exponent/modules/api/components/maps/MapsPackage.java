package abi10_0_0.host.exp.exponent.modules.api.components.maps;

import android.app.Activity;

import abi10_0_0.com.facebook.react.ReactPackage;
import abi10_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi10_0_0.com.facebook.react.bridge.NativeModule;
import abi10_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi10_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class MapsPackage implements ReactPackage {
    public MapsPackage(Activity activity) { } // backwards compatability
    public MapsPackage() { }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        AirMapCalloutManager calloutManager = new AirMapCalloutManager();
        AirMapMarkerManager annotationManager = new AirMapMarkerManager();
        AirMapPolylineManager polylineManager = new AirMapPolylineManager(reactContext);
        AirMapPolygonManager polygonManager = new AirMapPolygonManager(reactContext);
        AirMapCircleManager circleManager = new AirMapCircleManager(reactContext);
        AirMapManager mapManager = new AirMapManager(reactContext.getBaseContext());

        return Arrays.<ViewManager>asList(
                calloutManager,
                annotationManager,
                polylineManager,
                polygonManager,
                circleManager,
                mapManager);
    }
}
