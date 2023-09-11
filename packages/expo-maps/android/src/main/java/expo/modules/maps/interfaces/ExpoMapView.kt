package expo.modules.maps.interfaces

import expo.modules.kotlin.Promise
import expo.modules.maps.*
import expo.modules.maps.records.CameraMoveRecord

interface ExpoMapView {
  fun setMapType(mapType: MapType)
  fun setMarkers(markerObjects: Array<MarkerObject>)
  fun setPolygons(polygonObjects: Array<PolygonObject>)
  fun setPolylines(polylineObjects: Array<PolylineObject>)
  fun setCircles(circleObjects: Array<CircleObject>)
  fun setClusters(clusterObjects: Array<ClusterObject>)
  fun setEnabledTraffic(enableTraffic: Boolean)
  fun setKMLs(kmlObjects: Array<KMLObject>)
  fun setGeoJsons(geoJsonObjects: Array<GeoJsonObject>)
  fun setInitialCameraPosition(initialCameraPosition: CameraMoveRecord)
  fun moveCamera(cameraMove: CameraMoveRecord, promise: Promise?)
  fun setOverlays(overlayObjects: Array<OverlayObject>)
  fun setHeatmaps(heatmapObjects: Array<HeatmapObject>)
}
