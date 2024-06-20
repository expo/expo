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

enum NetworkCellularGeneration: CustomStringConvertible {
  case unknown, cellularGen2g, cellularGen3g, cellularGen4g, cellularGen5g

  var description: String {
    switch self {
    case .cellularGen2g:
      return "2G"
    case .cellularGen3g:
      return "3G"
    case .cellularGen4g:
      return "4G"
    case .cellularGen5g:
      return "5G"
    case .unknown:
      return "UNKNOWN"
    }
  }
}
