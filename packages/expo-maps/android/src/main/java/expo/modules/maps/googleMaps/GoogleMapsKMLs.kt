package expo.modules.maps.googleMaps

import android.content.Context
import android.net.Uri
import com.google.android.gms.maps.GoogleMap
import com.google.maps.android.data.kml.KmlLayer
import expo.modules.maps.KMLObject
import expo.modules.maps.interfaces.KMLs
import java.io.File

class GoogleMapsKMLs(private val context: Context, private val map: GoogleMap) : KMLs {

  private val layers = mutableListOf<KmlLayer>()

  override fun setKMLs(kmlObjects: Array<KMLObject>) {
    deleteKMLs()

    kmlObjects.forEach {
      val path = File(Uri.parse(it.filePath).path!!)
      val layer = KmlLayer(map, path.inputStream(), context)
      layer.addLayerToMap()
      layers.add(layer)
    }
  }

  private fun deleteKMLs() {
    layers.forEach { it.removeLayerFromMap() }
    layers.clear()
  }
}
