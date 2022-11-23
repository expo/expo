package expo.modules.maps.interfaces

import expo.modules.maps.MarkerObject

interface Markers {
  fun setMarkers(markerObjects: Array<MarkerObject>)
  fun detachAndDeleteMarkers()
}
