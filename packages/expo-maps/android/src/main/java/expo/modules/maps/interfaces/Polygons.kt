package expo.modules.maps.interfaces

import expo.modules.maps.PolygonObject

interface Polygons {
  fun setPolygons(polygonObjects: Array<PolygonObject>)
  fun detachAndDeletePolygons()
}
