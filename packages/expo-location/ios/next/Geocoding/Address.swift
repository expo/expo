import ExpoModulesCore

@Record
struct Address {
  var coordinates: Coordinates
  var name: String?
  var formattedAddress: String?
  var city: String?
  var country: String?
  var isoCountryCode: String?
}
