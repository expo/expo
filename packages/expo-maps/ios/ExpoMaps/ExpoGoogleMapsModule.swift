import ExpoModulesCore

public class ExpoGoogleMapsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGoogleMaps")

    Events(
      MapEventsNames.ON_CAMERA_MOVE_STARTED_EVENT.rawValue,
      MapEventsNames.ON_CAMERA_MOVE_ENDED_EVENT.rawValue,
      MapEventsNames.ON_MARKER_CLICK_EVENT.rawValue,
      MapEventsNames.ON_MARKER_DRAG_STARTED_EVENT.rawValue,
      MapEventsNames.ON_MARKER_DRAG_ENDED_EVENT.rawValue
    )

    AsyncFunction("getSearchCompletions") { (viewHandle: Int, searchQueryFragment: String, promise: Promise) in
      DispatchQueue.main.async {
        let view = self.appContext?.reactBridge?.uiManager?.view(forReactTag: NSNumber(value: viewHandle)) as? GoogleMapsView
        view?.fetchPlacesSearchCompletions(searchQueryFragment: searchQueryFragment, promise: promise)
      }
    }

    AsyncFunction("moveCamera") { (viewHandle: Int, cameraAnimation: CameraMoveRecord, promise: Promise) in
      DispatchQueue.main.async {
        let view = self.appContext?.reactBridge?.uiManager?.view(forReactTag: NSNumber(value: viewHandle)) as? GoogleMapsView
        view?.moveCamera(cameraMove: cameraAnimation, promise: promise)
      }
    }

    View(GoogleMapsView.self) {
      Events(
        "onMapPress",
        "onLongPress",
        "onMapLoaded",
        "onRegionChange",
        "onRegionChangeComplete",
        "onRegionChangeStarted",
        "onPoiClick",
        "onMarkerPress",
        "onMarkerDrag",
        "onMarkerDragStarted",
        "onMarkerDragComplete",
        "onClusterPress",
        "onLocationButtonPress",
        "onLocationDotPress",
        "onLocationChange"
      )

      Prop("showCompass") { (view: GoogleMapsView, enable: Bool) in
        view.setShowCompass(enable: enable)
      }

      Prop("showMyLocationButton") { (view: GoogleMapsView, enable: Bool) in
        view.setShowMyLocationButton(enable: enable)
      }

      Prop("showLevelPicker") { (view: GoogleMapsView, enable: Bool) in
        view.setShowLevelPicker(enable: enable)
      }

      Prop("enableRotateGestures") { (view: GoogleMapsView, enable: Bool) in
        view.setEnabledRotateGestures(enabled: enable)
      }

      Prop("enableScrollGestures") { (view: GoogleMapsView, enable: Bool) in
        view.setEnabledScrollGestures(enabled: enable)
      }

      Prop("enableTiltGestures") { (view: GoogleMapsView, enable: Bool) in
        view.setEnabledTiltGestures(enabled: enable)
      }

      Prop("enableZoomGestures") { (view: GoogleMapsView, enable: Bool) in
        view.setEnabledZoomGestures(enabled: enable)
      }

      Prop("mapType") { (view: GoogleMapsView, mapType: MapType) in
        view.setMapType(mapType: mapType)
      }

      Prop("googleMapsJsonStyleString") { (view: GoogleMapsView, jsonStyleString: String) in
        view.setMapStyle(jsonStyleString: jsonStyleString)
      }

      Prop("markers") { (view: GoogleMapsView, markerObjects: [MarkerObject]) in
        view.setMarkers(markerObjects: markerObjects)
      }

      Prop("clusters") { (view: GoogleMapsView, clusterObjects: [ClusterObject]) in
        view.setClusters(clusterObjects: clusterObjects)
      }

      Prop("polygons") { (view: GoogleMapsView, polygonObjects: [PolygonObject]) in
        view.setPolygons(polygonObjects: polygonObjects)
      }

      Prop("polylines") { (view: GoogleMapsView, polylineObjects: [PolylineObject]) in
        view.setPolylines(polylineObjects: polylineObjects)
      }

      Prop("initialCameraPosition") { (view: GoogleMapsView, cameraAnimation: CameraMoveRecord) in
        view.setInitialCameraPosition(initialCameraPosition: cameraAnimation)
      }

      Prop("circles") { (view: GoogleMapsView, circleObjects: [CircleObject]) in
        view.setCircles(circleObjects: circleObjects)
      }

      Prop("enableTraffic") { (view: GoogleMapsView, enable: Bool) in
        view.setEnabledTraffic(enableTraffic: enable)
      }

      Prop("kmls") { (view: GoogleMapsView, kmlObjects: [KMLObject]) in
        view.setKMLs(kmlObjects: kmlObjects)
      }

      Prop("geojsons") { (view: GoogleMapsView, geoJsonObjects: [GeoJsonObject]) in
        view.setGeoJsons(geoJsonObjects: geoJsonObjects)
      }

      Prop("overlays") { (view: GoogleMapsView, overlayObjects: [OverlayObject]) in
        view.setOverlays(overlayObjects: overlayObjects)
      }

      Prop("heatmaps") { (view: GoogleMapsView, heatmapObjects: [HeatmapObject]) in
        view.setHeatmaps(heatmapObjects: heatmapObjects)
      }

      Prop("clickablePOIs") { (view: GoogleMapsView, clickablePOIs: Bool) in
        view.setClickablePOIs(clickablePOIs: clickablePOIs)
      }

      Prop("createPOISearchRequest") { (view: GoogleMapsView, place: String) in
        view.createPOISearchRequest(place: place)
      }
    }
  }
}
