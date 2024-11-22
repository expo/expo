package expo.modules.maps

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.UIManagerModule
import expo.modules.core.interfaces.services.UIManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.maps.googleMaps.GoogleMapsView
import expo.modules.maps.records.CameraMoveRecord

class ExpoGoogleMapsModule : Module() {
  private lateinit var uiManager: UIManager

  override fun definition() = ModuleDefinition {
    Name("ExpoGoogleMaps")

    OnCreate {
      uiManager = appContext.legacyModule<UIManager>() ?: throw MissingUIManagerException()
    }

    AsyncFunction("getSearchCompletions") { viewHandle: Int, searchQueryFragment: String, promise: Promise ->
      appContext.throwingActivity.runOnUiThread {
        val view = uiManager.resolveView(viewHandle) as GoogleMapsView
        view.fetchPlacesSearchCompletions(searchQueryFragment, promise)
      }
    }
    AsyncFunction("moveCamera") { viewHandle: Int, cameraPosition: CameraMoveRecord, promise: Promise ->
      appContext.throwingActivity.runOnUiThread {
        val view = uiManager.resolveView(viewHandle) as GoogleMapsView
        view.moveCamera(cameraPosition, promise)
      }
    }

    View(GoogleMapsView::class) {
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

      OnViewDestroys<GoogleMapsView> {
        it.onViewDestroyed()
      }

      Prop("enableRotateGestures") { view: GoogleMapsView, enable: Boolean ->
        view.setEnabledRotateGestures(enable)
      }

      Prop("enableScrollGestures") { view: GoogleMapsView, enable: Boolean ->
        view.setEnabledScrollGestures(enable)
      }

      Prop("enableTiltRotateGestures") { view: GoogleMapsView, enable: Boolean ->
        view.setEnabledTiltGestures(enable)
      }

      Prop("enableZoomGestures") { view: GoogleMapsView, enable: Boolean ->
        view.setEnabledZoomGestures(enable)
      }

      Prop("mapType") { view: GoogleMapsView, mapType: MapType ->
        view.setMapType(mapType)
      }

      Prop("showZoomControls") { view: GoogleMapsView, enable: Boolean ->
        view.setShowZoomControl(enable)
      }

      Prop("showCompass") { view: GoogleMapsView, enable: Boolean ->
        view.setShowCompass(enable)
      }

      Prop("showMapToolbar") { view: GoogleMapsView, enable: Boolean ->
        view.setShowMapToolbar(enable)
      }

      Prop("showMyLocationButton") { view: GoogleMapsView, enable: Boolean ->
        view.setShowMyLocationButton(enable)
      }

      Prop("showLevelPicker") { view: GoogleMapsView, enable: Boolean ->
        view.setShowLevelPicker(enable)
      }

      Prop("googleMapsJsonStyleString") { view: GoogleMapsView, jsonStyleString: String ->
        view.setMapStyle(jsonStyleString)
      }

      Prop("markers") { view: GoogleMapsView, markerObjects: Array<MarkerObject> ->
        view.setMarkers(markerObjects)
      }

      Prop("polygons") { view: GoogleMapsView, polygonObjects: Array<PolygonObject> ->
        view.setPolygons(polygonObjects)
      }

      Prop("polylines") { view: GoogleMapsView, polylineObjects: Array<PolylineObject> ->
        view.setPolylines(polylineObjects)
      }

      Prop("initialCameraPosition") { view: GoogleMapsView, initialCameraPosition: CameraMoveRecord ->
        view.setInitialCameraPosition(initialCameraPosition)
      }

      Prop("circles") { view: GoogleMapsView, circleObjects: Array<CircleObject> ->
        view.setCircles(circleObjects)
      }

      Prop("clusters") { view: GoogleMapsView, clusterObjects: Array<ClusterObject> ->
        view.setClusters(clusterObjects)
      }

      Prop("enableTraffic") { view: GoogleMapsView, enable: Boolean ->
        view.setEnabledTraffic(enable)
      }

      Prop("kmls") { view: GoogleMapsView, kmlObjects: Array<KMLObject> ->
        view.setKMLs(kmlObjects)
      }

      Prop("geojsons") { view: GoogleMapsView, geoJsonObjects: Array<GeoJsonObject> ->
        view.setGeoJsons(geoJsonObjects)
      }

      Prop("overlays") { view: GoogleMapsView, overlayObjects: Array<OverlayObject> ->
        view.setOverlays(overlayObjects)
      }

      Prop("heatmaps") { view: GoogleMapsView, heatmapObjects: Array<HeatmapObject> ->
        view.setHeatmaps(heatmapObjects)
      }

      Prop("createPOISearchRequest") { view: GoogleMapsView, place: String ->
        view.createPlaceSearchRequest(place)
      }

      Prop("clickablePOIs") { view: GoogleMapsView, arePOIClickable: Boolean ->
        view.setClickablePOIs(arePOIClickable)
      }

      Prop("onLocationChangeEventPriority") { view: GoogleMapsView, priority: Int ->
        view.setLocationCallbackPriority(priority)
      }

      Prop("onLocationChangeEventInterval") { view: GoogleMapsView, interval: Double ->
        view.setLocationCallbackInterval(interval.toLong())
      }
    }
  }
}
