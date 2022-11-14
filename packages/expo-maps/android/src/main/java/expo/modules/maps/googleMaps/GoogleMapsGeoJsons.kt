package expo.modules.maps.googleMaps

import com.google.android.gms.maps.GoogleMap
import com.google.maps.android.data.geojson.*
import expo.modules.maps.GeoJsonObject
import expo.modules.maps.interfaces.GeoJsons
import org.json.JSONObject

class GoogleMapsGeoJsons(private val map: GoogleMap) : GeoJsons {
  private val layers = mutableListOf<GeoJsonLayer>()

  override fun setGeoJsons(geoJsonObjects: Array<GeoJsonObject>) {
    deleteGeoJsons()
    geoJsonObjects.forEach { geoJsonObject ->
      val geoJsonData = JSONObject(geoJsonObject.geoJsonString)
      val layer = GeoJsonLayer(map, geoJsonData)
      setDefaultStyleForLayer(geoJsonObject, layer)

      for (feature in layer.features) {
        setPolygonFeatureStyle(feature, layer)
        setPolylineFeatureStyle(feature, layer)
        setMarkerFeatureStyle(feature, layer)
      }

      layer.addLayerToMap()
      layers.add(layer)
    }
  }

  private fun deleteGeoJsons() {
    layers.forEach { it.removeLayerFromMap() }
    layers.clear()
  }

  private fun setPolygonFeatureStyle(feature: GeoJsonFeature, layer: GeoJsonLayer) {
    val polygonStyle = GeoJsonPolygonStyle()

    polygonStyle.strokeColor = if (feature.hasProperty("strokeColor")) {
      colorStringToARGBInt(feature.getProperty("strokeColor"))
    } else {
      layer.defaultPolygonStyle.strokeColor
    }

    polygonStyle.fillColor = if (feature.hasProperty("fillColor")) {
      colorStringToARGBInt(feature.getProperty("fillColor"))
    } else {
      layer.defaultPolygonStyle.fillColor
    }

    polygonStyle.strokeWidth = if (feature.hasProperty("strokeWidth")) {
      feature.getProperty("strokeWidth").toFloat()
    } else {
      layer.defaultPolygonStyle.strokeWidth
    }

    polygonStyle.strokeJointType = if (feature.hasProperty("strokeJointType")) {
      jointTypeStringToInt(feature.getProperty("strokeJointType"))
    } else {
      layer.defaultPolygonStyle.strokeJointType
    }

    polygonStyle.strokePattern = if (feature.hasProperty("strokePattern")) {
      patternItemStringToGoogleMapsPatternItemList(feature.getProperty("strokePattern"))
    } else {
      layer.defaultPolygonStyle.strokePattern
    }
    feature.polygonStyle = polygonStyle
  }

  private fun setPolylineFeatureStyle(feature: GeoJsonFeature, layer: GeoJsonLayer) {
    val polylineStyle = GeoJsonLineStringStyle()

    polylineStyle.color = if (feature.hasProperty("color")) {
      colorStringToARGBInt(feature.getProperty("color"))
    } else {
      layer.defaultLineStringStyle.color
    }

    polylineStyle.pattern = if (feature.hasProperty("pattern")) {
      patternItemStringToGoogleMapsPatternItemList(feature.getProperty("pattern"))
    } else {
      layer.defaultLineStringStyle.pattern
    }
    feature.lineStringStyle = polylineStyle
  }

  private fun setMarkerFeatureStyle(feature: GeoJsonFeature, layer: GeoJsonLayer) {
    val markerStyle = GeoJsonPointStyle()
    markerStyle.title = if (feature.hasProperty("title")) {
      feature.getProperty("title")
    } else {
      layer.defaultPointStyle.title
    }

    markerStyle.snippet = if (feature.hasProperty("snippet")) {
      feature.getProperty("snippet")
    } else {
      layer.defaultPointStyle.snippet
    }

    markerStyle.icon = if (feature.hasProperty("color")) {
      provideDescriptor(null, feature.getProperty("color"))
    } else {
      layer.defaultPointStyle.icon
    }
    feature.pointStyle = markerStyle
  }

  private fun setDefaultStyleForLayer(geoJsonObject: GeoJsonObject, layer: GeoJsonLayer) {
    if (geoJsonObject.defaultStyle?.marker != null) {
      val defaultMarkerStyle = layer.defaultPointStyle
      geoJsonObject.defaultStyle.marker.title?.let {
        defaultMarkerStyle.title = it
      }
      geoJsonObject.defaultStyle.marker.snippet?.let {
        defaultMarkerStyle.snippet = it
      }
      geoJsonObject.defaultStyle.marker.color?.let {
        provideDescriptor(null, it)
      }
    }

    if (geoJsonObject.defaultStyle?.polygon != null) {
      val defaultPolygonStyle = layer.defaultPolygonStyle
      geoJsonObject.defaultStyle.polygon.strokeColor?.let {
        defaultPolygonStyle.strokeColor = colorStringToARGBInt(it)
      }
      geoJsonObject.defaultStyle.polygon.fillColor?.let {
        defaultPolygonStyle.fillColor = colorStringToARGBInt(it)
      }
      geoJsonObject.defaultStyle.polygon.strokeWidth?.let {
        defaultPolygonStyle.strokeWidth = it
      }
      geoJsonObject.defaultStyle.polygon.strokeJointType?.let {
        defaultPolygonStyle.strokeJointType = jointTypeStringToInt(it)
      }
      geoJsonObject.defaultStyle.polygon.strokePattern?.let {
        defaultPolygonStyle.strokePattern = it.map(::patternItemToNative)
      }
    }

    if (geoJsonObject.defaultStyle?.polyline != null) {
      val defaultPolylineStyle = layer.defaultLineStringStyle
      geoJsonObject.defaultStyle.polyline.color?.let {
        defaultPolylineStyle.color = colorStringToARGBInt(it)
      }
      geoJsonObject.defaultStyle.polyline.pattern?.let {
        defaultPolylineStyle.pattern = it.map(::patternItemToNative)
      }
    }
  }
}
