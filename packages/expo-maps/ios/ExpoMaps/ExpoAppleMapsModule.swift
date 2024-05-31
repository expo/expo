import React
import ExpoModulesCore

public class ExpoAppleMapsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAppleMaps")

    Events(
      MapEventsNames.ON_CAMERA_MOVE_STARTED_EVENT.rawValue,
      MapEventsNames.ON_CAMERA_MOVE_ENDED_EVENT.rawValue,
      MapEventsNames.ON_MARKER_CLICK_EVENT.rawValue,
      MapEventsNames.ON_MARKER_DRAG_STARTED_EVENT.rawValue,
      MapEventsNames.ON_MARKER_DRAG_ENDED_EVENT.rawValue
    )

    AsyncFunction("getSearchCompletions") { (viewHandle: Int, searchQueryFragment: String, promise: Promise) in
      DispatchQueue.main.async {
        let view = self.appContext?.reactBridge?.uiManager?.view(forReactTag: NSNumber(value: viewHandle)) as? AppleMapsView
        view?.fetchPOISearchCompletions(searchQueryFragment: searchQueryFragment, promise: promise)
      }
    }

    AsyncFunction("moveCamera") { (viewHandle: Int, cameraAnimation: CameraMoveRecord, promise: Promise) in
      DispatchQueue.main.async {
        let view = self.appContext?.reactBridge?.uiManager?.view(forReactTag: NSNumber(value: viewHandle)) as? AppleMapsView
        view?.moveCamera(cameraMove: cameraAnimation, promise: promise)
      }
    }

    View(AppleMapsView.self) {
      Events(
        "onMapPress",
        "onDoublePress",
        "onLongPress",
        "onMapLoaded",
        "onRegionChange",
        "onRegionChangeComplete",
        "onRegionChangeStarted",
        "onMarkerPress",
        "onMarkerDrag",
        "onMarkerDragStarted",
        "onMarkerDragComplete",
        "onClusterPress",
        "onLocationButtonPress",
        "onLocationDotPress",
        "onLocationChange"
      )

      Prop("showCompass") { (view: AppleMapsView, enable: Bool) in
        view.setShowCompass(enable: enable)
      }

      Prop("showMyLocationButton") { (view: AppleMapsView, enable: Bool) in
        view.setShowMyLocationButton(enable: enable)
      }

      Prop("showLevelPicker") { (view: AppleMapsView, enable: Bool) in
        view.setShowLevelPicker(enable: enable)
      }

      Prop("enableRotateGestures") { (view: AppleMapsView, enable: Bool) in
        view.setEnabledRotateGestures(enabled: enable)
      }

      Prop("enableScrollGestures") { (view: AppleMapsView, enable: Bool) in
        view.setEnabledScrollGestures(enabled: enable)
      }

      Prop("enableTiltGestures") { (view: AppleMapsView, enable: Bool) in
        view.setEnabledTiltGestures(enabled: enable)
      }

      Prop("enableZoomGestures") { (view: AppleMapsView, enable: Bool) in
        view.setEnabledZoomGestures(enabled: enable)
      }

      Prop("mapType") { (view: AppleMapsView, mapType: MapType) in
        view.setMapType(mapType: mapType)
      }

      Prop("markers") { (view: AppleMapsView, markerObjects: [MarkerObject]) in
        view.setMarkers(markerObjects: markerObjects)
      }

      Prop("clusters") { (view: AppleMapsView, clusterObjects: [ClusterObject]) in
        view.setClusters(clusterObjects: clusterObjects)
      }

      Prop("polygons") { (view: AppleMapsView, polygonObjects: [PolygonObject]) in
        view.setPolygons(polygonObjects: polygonObjects)
      }

      Prop("polylines") { (view: AppleMapsView, polylineObjects: [PolylineObject]) in
        view.setPolylines(polylineObjects: polylineObjects)
      }

      Prop("circles") { (view: AppleMapsView, circleObjects: [CircleObject]) in
        view.setCircles(circleObjects: circleObjects)
      }

      Prop("initialCameraPosition") { (view: AppleMapsView, cameraAnimation: CameraMoveRecord) in
        view.setInitialCameraPosition(initialCameraPosition: cameraAnimation)
      }

      Prop("enableTraffic") { (view: AppleMapsView, enable: Bool) in
        view.setEnabledTraffic(enableTraffic: enable)
      }

      Prop("kmls") { (view: AppleMapsView, kmlObjects: [KMLObject]) in
        view.setKMLs(kmlObjects: kmlObjects)
      }

      Prop("geojsons") { (view: AppleMapsView, geoJsonObjects: [GeoJsonObject]) in
        view.setGeoJsons(geoJsonObjects: geoJsonObjects)
      }

      Prop("enablePOISearching") { (view: AppleMapsView, enable: Bool) in
        view.setEnabledPOISearching(enabled: enable)
      }

      Prop("enablePOIFilter") { (view: AppleMapsView, categories: [POICategoryType]) in
        view.setEnabledPOIFilter(categories: categories)
      }

      Prop("enablePOIs") { (view: AppleMapsView, enabled: Bool) in
        view.setEnabledPOIs(enabled: enabled)
      }

      Prop("createPOISearchRequest") { (view: AppleMapsView, place: String) in
        view.createPOISearchRequest(place: place)
      }
    }
  }
}
