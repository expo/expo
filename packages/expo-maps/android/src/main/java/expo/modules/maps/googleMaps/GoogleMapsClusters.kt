package expo.modules.maps.googleMaps

import android.content.Context
import android.net.Uri
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.maps.android.clustering.Cluster
import com.google.maps.android.clustering.ClusterManager
import com.google.maps.android.clustering.view.DefaultClusterRenderer
import com.google.maps.android.collections.MarkerManager
import expo.modules.kotlin.viewevent.ViewEventCallback
import expo.modules.maps.ClusterObject
import expo.modules.maps.MarkerObject
import expo.modules.maps.interfaces.Clusters
import expo.modules.maps.records.ClusterRecord
import expo.modules.maps.records.MarkerRecord

// Context has to be passed in order to use custom cluster manager and renderer
class GoogleMapsClusters(
  private val context: Context,
  private val map: GoogleMap,
  private val markerManager: MarkerManager,
  private val onClusterPressed: ViewEventCallback<ClusterRecord>,
  private val onClusterItemPress: ViewEventCallback<MarkerRecord>
) : Clusters {

  private val clusters: MutableList<ExpoClusterManager> = mutableListOf()

  // After each cluster's items modification cluster() has to be called on cluster manager
  override fun setClusters(clusterObjects: Array<ClusterObject>) {
    clusters.forEach {
      it.clearItems()
      it.cluster()
    }

    clusters.clear()

    clusterObjects.forEach { clusterObject ->
      val clusterManager = ExpoClusterManager(
        clusterObject.id,
        clusterObject.minimumClusterSize,
        clusterObject.markerTitle,
        clusterObject.markerSnippet,
        clusterObject.icon,
        clusterObject.color,
        clusterObject.opacity
      )

      clusterManager.addItems(clusterObject.markers)
      clusterManager.cluster()
      clusters.add(clusterManager)
    }

    setOnClusterItemClickedListener()
    setOnClusterClickedListener()
  }

  fun onCameraIdle() {
    // Cluster/uncluster markers
    clusters.forEach {
      it.onCameraIdle()
    }
  }

  private fun setOnClusterItemClickedListener() {
    clusters.forEach { expoClusterManager ->
      expoClusterManager.setOnClusterItemClickListener { markerObject ->
        markerObject?.let {
          onClusterItemPress(MarkerRecord(it))
        }
        false
      }
    }
  }

  private fun setOnClusterClickedListener() {
    clusters.forEach { expoClusterManager ->
      expoClusterManager.setOnClusterClickListener {
        it?.let {
          onClusterPressed(ClusterRecord(expoClusterManager.id, it))
        }
        false
      }
    }
  }

  inner class ExpoClusterManager(
    val id: String?,
    val minimumClusterSize: Int,
    val title: String?,
    val snippet: String?,
    val icon: String?,
    val color: String?,
    val opacity: Double
  ) : ClusterManager<MarkerObject>(context, map, markerManager) {

    init {
      renderer = ExpoClusterRenderer(this)
    }
  }

  /*
    When using custom renderer one has to override additional methods as in:
    https://github.com/googlemaps/android-maps-utils#clustering
   */
  private inner class ExpoClusterRenderer(
    private val clusterManager: ExpoClusterManager
  ) : DefaultClusterRenderer<MarkerObject>(context, map, clusterManager) {

    init {
      minClusterSize = clusterManager.minimumClusterSize
    }

    override fun getColor(clusterSize: Int): Int {
      return if (clusterManager.color != null) {
        colorStringToARGBInt(clusterManager.color)
      } else {
        0
      }
    }

    override fun onBeforeClusterItemRendered(item: MarkerObject, markerOptions: MarkerOptions) {
      val localUri = item.icon?.let { Uri.parse(it)?.path }
      markerOptions
        .position(LatLng(item.latitude, item.longitude))
        .title(item.markerTitle)
        .snippet(item.markerSnippet)
        .anchor((item.anchorU ?: 0.5).toFloat(), (item.anchorV ?: 1).toFloat())
        .alpha(item.opacity.toFloat())
        .icon(provideDescriptor(localUri, item.color))
    }

    override fun onClusterItemUpdated(item: MarkerObject, marker: Marker) {
      val localUri = item.icon?.let { Uri.parse(it)?.path }
      marker.position = LatLng(item.latitude, item.longitude)
      marker.title = item.markerTitle
      marker.snippet = item.markerSnippet
      marker.setAnchor((item.anchorU ?: 0.5).toFloat(), (item.anchorV ?: 1).toFloat())
      marker.alpha = item.opacity.toFloat()
      marker.setIcon(provideDescriptor(localUri, item.color))
    }

    override fun onBeforeClusterRendered(
      cluster: Cluster<MarkerObject>,
      markerOptions: MarkerOptions
    ) {
      markerOptions
        .title(clusterManager.title)
        .snippet(clusterManager.snippet)
        .alpha(clusterManager.opacity.toFloat())

      val localUri = clusterManager.icon?.let { Uri.parse(it)?.path }
      if (localUri != null) {
        markerOptions.icon(BitmapDescriptorFactory.fromPath(localUri))
      } else {
        markerOptions.icon(getDescriptorForCluster(cluster))
      }
    }

    override fun onClusterUpdated(cluster: Cluster<MarkerObject>, marker: Marker) {
      marker.title = clusterManager.title
      marker.snippet = clusterManager.snippet
      marker.alpha = clusterManager.opacity.toFloat()

      val localUri = clusterManager.icon?.let { Uri.parse(it)?.path }
      if (localUri != null) {
        marker.setIcon(BitmapDescriptorFactory.fromPath(localUri))
      } else {
        marker.setIcon(getDescriptorForCluster(cluster))
      }
    }
  }
}
