package expo.modules.maps.googleMaps

import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.TileOverlay
import com.google.android.gms.maps.model.TileOverlayOptions
import com.google.maps.android.heatmaps.Gradient
import com.google.maps.android.heatmaps.HeatmapTileProvider
import com.google.maps.android.heatmaps.WeightedLatLng
import expo.modules.maps.HeatmapObject
import expo.modules.maps.interfaces.Heatmaps

class GoogleMapsHeatmaps(private val map: GoogleMap) : Heatmaps {

  private val heatmapOverlays = mutableListOf<TileOverlay>()

  override fun setHeatmaps(heatmapObjects: Array<HeatmapObject>) {
    heatmapOverlays.forEach { it.remove() }
    heatmapOverlays.clear()

    for (heatmapObject in heatmapObjects) {
      var builder = HeatmapTileProvider.Builder()
        .weightedData(
          heatmapObject.points.map {
            WeightedLatLng(LatLng(it.latitude, it.longitude), it.data ?: 1.0)
          }
        )
      heatmapObject.gradient?.let {
        builder = builder.gradient(
          Gradient(
            it.colors.map { colorHexStringToInt(it) }.toIntArray(),
            it.locations
          )
        )
      }
      heatmapObject.radius.let {
        builder = builder.radius(it ?: 20)
      }
      heatmapObject.opacity.let {
        builder = builder.opacity(it ?: 1.0)
      }
      val provider = builder.build()
      val tileOverlay = map.addTileOverlay(TileOverlayOptions().tileProvider(provider))
      tileOverlay?.let { heatmapOverlays.add(it) }
    }
  }
}
