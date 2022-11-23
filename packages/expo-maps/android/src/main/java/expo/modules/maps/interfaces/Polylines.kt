package expo.modules.maps.interfaces

import expo.modules.maps.PolylineObject

interface Polylines {
  fun setPolylines(polylineObjects: Array<PolylineObject>)
  fun detachAndDeletePolylines()
}
