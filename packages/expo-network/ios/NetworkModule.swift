import ExpoModulesCore
import Foundation
import SystemConfiguration
import Network

enum NetworkType: CustomStringConvertible {
  case unknown, wifi, none, cellular
  
  var description: String {
    switch self {
    case .wifi:
     return "WIFI"
    case .cellular:
      return "CELLULAR"
    case .unknown:
      return "UNKNOWN"
    case .none:
      return "NONE"
    }
  }
}

public final class NetworkModule: Module {
  private var type = NetworkType.unknown
  private var connected: Bool {
    self.type != NetworkType.unknown && self.type != NetworkType.none
  }
  private var lastFlags: SCNetworkReachabilityFlags?
  
  public func definition() -> ModuleDefinition {
    Name("ExpoNetwork")
    
    AsyncFunction("getIpAddressAsync") { () -> String? in
      var address = "0.0.0.0"
      var ifaddr: UnsafeMutablePointer<ifaddrs>?
      
      guard getifaddrs(&ifaddr) == 0 else { return nil }
      guard let firstAddr = ifaddr else { return nil }
      
      for ifptr in sequence(first:firstAddr , next: { $0.pointee.ifa_next }) {
        let temp = ifptr.pointee
        let family = temp.ifa_addr.pointee.sa_family
        
        if family == UInt8(AF_INET) {
          let name = String(cString: temp.ifa_name)
          if name == "en0" || name == "en1" {
            var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            getnameinfo(temp.ifa_addr, socklen_t(temp.ifa_addr.pointee.sa_len),
                        &hostname, socklen_t(hostname.count),
                        nil, socklen_t(0), NI_NUMERICHOST)
            address = String(cString: hostname)
          }
        }
      }
      
      freeifaddrs(ifaddr)
      return address
    }
    
    AsyncFunction("getNetworkStateAsync") { (promise: Promise) in
      var zeroAddress = sockaddr_in()
      bzero(&zeroAddress, MemoryLayout.size(ofValue: zeroAddress))
      zeroAddress.sin_len = UInt8(MemoryLayout.size(ofValue: zeroAddress))
      zeroAddress.sin_family = sa_family_t(AF_INET)
      
      let reachability = createReachabilityRef()
      let flags = self.lastFlags
      
      if ((flags?.contains(.reachable) ?? false || flags?.contains(.connectionRequired) ?? false)) {
        self.type = .unknown
      } else {
        self.type = .wifi
      }
      
      #if os(tvOS)
      if (flags?.contains(.isWWAN) ?? false) {
        self.type = .cellular
      }
      #endif
      
      promise.resolve([
        "type": self.type.description,
        "isConnected": self.connected,
        "isInternetReachable": self.connected
      ])
    }
  }
  
  func createReachabilityRef() -> SCNetworkReachability? {
    var zeroAddress = sockaddr()
    zeroAddress.sa_len = UInt8(MemoryLayout.size(ofValue: zeroAddress))
    zeroAddress.sa_family = sa_family_t(AF_INET)
    
    let reachability = withUnsafePointer(to: &zeroAddress) {
      SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault, $0)
    }
    
    var flags = SCNetworkReachabilityFlags()
    guard let reachability = SCNetworkReachabilityCreateWithAddress(nil, &zeroAddress) else { return nil }
    
    SCNetworkReachabilityGetFlags(reachability, &flags)
    self.lastFlags = flags
    return reachability
  }
}
