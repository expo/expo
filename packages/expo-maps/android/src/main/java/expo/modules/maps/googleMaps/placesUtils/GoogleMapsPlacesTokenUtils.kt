package expo.modules.maps.googleMaps.placesUtils

import com.google.android.libraries.places.api.model.AutocompleteSessionToken

class GoogleMapsPlacesTokenUtils {

  private var token = AutocompleteSessionToken.newInstance()

  fun setNewSessionToken() {
    token = AutocompleteSessionToken.newInstance()
  }

  fun getToken(): AutocompleteSessionToken? {
    return token
  }
}
