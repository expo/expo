import Network

extension NWInterface.InterfaceType: CaseIterable {
  public static var allCases: [NWInterface.InterfaceType] = [
    .other,
    .wifi,
    .cellular,
    .loopback,
    .wiredEthernet
  ]
}

enum NetworkType: CustomStringConvertible {
  case unknown, wifi, none, cellular, wiredEthernet

  var description: String {
    switch self {
    case .wifi:
      return "WIFI"
    case .cellular:
      return "CELLULAR"
    case .wiredEthernet:
      return "ETHERNET"
    case .unknown:
      return "UNKNOWN"
    case .none:
      return "NONE"
    }
  }
}
