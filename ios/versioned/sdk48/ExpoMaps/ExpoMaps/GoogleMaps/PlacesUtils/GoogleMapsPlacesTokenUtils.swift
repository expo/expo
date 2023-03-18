import GooglePlaces

class GoogleMapsPlacesTokenUtils {
  private var token: GMSAutocompleteSessionToken?

  init() {
    token = GMSAutocompleteSessionToken.init()
  }

  func setNewSessionToken() {
    token = GMSAutocompleteSessionToken.init()
  }

  func deleteToken() {
    token = nil
  }

  func getToken() -> GMSAutocompleteSessionToken? {
    if let token = token {
      return token
    }
    print("GMSAutocompleteSessionToken was not set")
    return nil
  }
}
