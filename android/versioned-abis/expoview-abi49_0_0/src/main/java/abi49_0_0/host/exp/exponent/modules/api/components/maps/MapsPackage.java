package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import abi49_0_0.com.facebook.react.ReactPackage;
import abi49_0_0.com.facebook.react.bridge.NativeModule;
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.List;

public class MapsPackage implements ReactPackage {

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();

    modules.add(new MapModule(reactContext));

    return modules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    MapManager mapManager = new MapManager(reactContext);
    MapMarkerManager annotationManager = new MapMarkerManager();
    mapManager.setMarkerManager(annotationManager);

    List<ViewManager> viewManagers = new ArrayList<>();

    viewManagers.add(mapManager);
    viewManagers.add(annotationManager);
    viewManagers.add(new MapCalloutManager());
    viewManagers.add(new MapPolylineManager(reactContext));
    viewManagers.add(new MapGradientPolylineManager(reactContext));
    viewManagers.add(new MapPolygonManager(reactContext));
    viewManagers.add(new MapCircleManager(reactContext));
    viewManagers.add(new MapLiteManager(reactContext));
    viewManagers.add(new MapUrlTileManager(reactContext));
    viewManagers.add(new MapWMSTileManager(reactContext));
    viewManagers.add(new MapLocalTileManager(reactContext));
    viewManagers.add(new MapOverlayManager(reactContext));
    viewManagers.add(new MapHeatmapManager());

    return viewManagers;
  }
}
