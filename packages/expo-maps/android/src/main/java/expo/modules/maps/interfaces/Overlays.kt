package expo.modules.maps.interfaces

import expo.modules.maps.OverlayObject

interface Overlays {
  fun setOverlays(overlayObjects: Array<OverlayObject>)
  fun detachAndDeleteOverlays()
}
