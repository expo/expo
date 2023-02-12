import ExpoModulesCore

internal class IpAddressException: GenericException<Int32> {
  override var reason: String {
    "No network interfaces could be retrieved. getifaddrs() failed with error number: \(param)"
  }
}
