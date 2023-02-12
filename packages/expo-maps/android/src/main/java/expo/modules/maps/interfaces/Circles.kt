package expo.modules.maps.interfaces

import expo.modules.maps.CircleObject

interface Circles {
  fun setCircles(circleObjects: Array<CircleObject>)
  fun detachAndDeleteCircles()
}
