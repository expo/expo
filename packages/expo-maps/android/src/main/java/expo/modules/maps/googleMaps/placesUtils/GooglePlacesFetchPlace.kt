package expo.modules.maps.googleMaps.placesUtils

import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.LatLng
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FetchPlaceResponse
import com.google.android.libraries.places.api.net.PlacesClient
import expo.modules.maps.MarkerObject
import expo.modules.maps.googleMaps.GoogleMapsMarkers

class GooglePlacesFetchPlace(
  private val placesClient: PlacesClient,
  private val tokenUtils: GoogleMapsPlacesTokenUtils,
  private val markers: GoogleMapsMarkers,
  private val map: GoogleMap
) {

  private var fetchedPlace: Place? = null
    set(newValue) {
      field = newValue
      displayMarker()
    }

  fun search(placeId: String) {
    val placeFields = listOf(Place.Field.LAT_LNG, Place.Field.NAME, Place.Field.ADDRESS)
    val request = FetchPlaceRequest.newInstance(placeId, placeFields)

    placesClient.fetchPlace(request)
      .addOnSuccessListener { response: FetchPlaceResponse ->
        fetchedPlace = response.place
      }
      .addOnFailureListener { exception: Exception ->
        println("FetchPlace error, ${exception.message}")
      }

    tokenUtils.setNewSessionToken()
  }

  private fun displayMarker() {
    val marker = getMarkerToDisplay() ?: return
    markers.setPOIMarkers(arrayOf(marker))
    val update = CameraUpdateFactory.newLatLng(LatLng(marker.latitude, marker.longitude))
    map.moveCamera(update)
  }

  private fun getMarkerToDisplay(): MarkerObject? {
    val place = fetchedPlace ?: return null
    val latitude = place.latLng?.latitude ?: return null
    val longitude = place.latLng?.longitude ?: return null
    return MarkerObject(
      null,
      latitude,
      longitude,
      place.name ?: "",
      place.address ?: "",
      null,
      "red",
      false,
      null,
      null,
      1.0
    )
  }
}
