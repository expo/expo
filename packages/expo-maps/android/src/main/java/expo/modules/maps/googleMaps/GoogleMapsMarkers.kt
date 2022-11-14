package expo.modules.maps.googleMaps

import android.net.Uri
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.maps.android.collections.MarkerManager
import expo.modules.kotlin.viewevent.ViewEventCallback
import expo.modules.maps.MarkerObject
import expo.modules.maps.interfaces.Markers
import expo.modules.maps.records.MarkerRecord

class GoogleMapsMarkers(private val map: GoogleMap, markerManager: MarkerManager) : Markers {

  private val markers = mutableMapOf<Marker, String?>()
  private val poiMarkers = mutableListOf<Marker>()
  private val markerManagerCollection: MarkerManager.Collection = markerManager.Collection()

  override fun setMarkers(markerObjects: Array<MarkerObject>) {
    detachAndDeleteMarkers()

    markerObjects.forEach { markerObject ->
      val markerOptions = MarkerOptions()
      val localUri = markerObject.icon?.let { Uri.parse(it)?.path }
      markerOptions
        .position(LatLng(markerObject.latitude, markerObject.longitude))
        .title(markerObject.markerTitle)
        .snippet(markerObject.markerSnippet)
        .draggable(markerObject.draggable)
        .anchor((markerObject.anchorU ?: 0.5).toFloat(), (markerObject.anchorV ?: 1).toFloat())
        .alpha(markerObject.opacity.toFloat())
        .icon(provideDescriptor(localUri, markerObject.color))

      markerManagerCollection.addMarker(markerOptions).let {
        markers[it] = markerObject.id
      }
    }
  }

  fun setOnMarkerPressListener(onMarkerPress: ViewEventCallback<MarkerRecord>) {
    markerManagerCollection.setOnMarkerClickListener { marker ->
      markers[marker]?.let {
        onMarkerPress(MarkerRecord(marker))
      }
      false
    }
  }

  fun setOnMarkerDragListeners(onDrag: ViewEventCallback<MarkerRecord>, onDragStarted: ViewEventCallback<MarkerRecord>, onDragComplete: ViewEventCallback<MarkerRecord>) {
    markerManagerCollection.setOnMarkerDragListener(object : GoogleMap.OnMarkerDragListener {

      override fun onMarkerDrag(marker: Marker) {
        markers[marker]?.let { onDrag(MarkerRecord(marker)) }
      }

      override fun onMarkerDragEnd(marker: Marker) {
        markers[marker]?.let {
          onDragComplete(MarkerRecord(marker))
        }
      }

      override fun onMarkerDragStart(marker: Marker) {
        markers[marker]?.let {
          onDragStarted(MarkerRecord(marker))
        }
      }
    })
  }

  fun setPOIMarkers(markerObjects: Array<MarkerObject>) {
    detachAndDeletePOIMarkers()

    markerObjects.forEach { markerObject ->
      val markerOptions = MarkerOptions()
      val localUri = markerObject.icon?.let { Uri.parse(it)?.path }
      markerOptions
        .position(LatLng(markerObject.latitude, markerObject.longitude))
        .title(markerObject.markerTitle)
        .snippet(markerObject.markerSnippet)
        .draggable(markerObject.draggable)
        .anchor((markerObject.anchorU ?: 0.5).toFloat(), (markerObject.anchorV ?: 1).toFloat())
        .alpha(markerObject.opacity.toFloat())
        .icon(provideDescriptor(localUri, markerObject.color))

      map.addMarker(markerOptions)?.let { poiMarkers.add(it) }
    }
  }

  override fun detachAndDeleteMarkers() {
    markerManagerCollection.clear()
    markers.clear()
  }

  fun detachAndDeletePOIMarkers() {
    poiMarkers.forEach { it.remove() }
    poiMarkers.clear()
  }

  fun getMarkers(): MutableMap<Marker, String?> {
    return markers
  }
}
