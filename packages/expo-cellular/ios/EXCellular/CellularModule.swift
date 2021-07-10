import CoreTelephony
import ExpoModulesCore

public class CellularModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoCellular")
    constants {
      // FIXME: Carrier details shouldn't be constants.
      // Constants are returned to JS only once, but the carrier may change over time.
      let carrier = Self.currentCarrier()

      return [
        "allowsVoip": carrier?.allowsVOIP,
        "carrier": carrier?.carrierName,
        "isoCountryCode": carrier?.isoCountryCode,
        "mobileCountryCode": carrier?.mobileCountryCode,
        "mobileNetworkCode": carrier?.mobileNetworkCode
      ]
    }
    method("getCellularGenerationAsync") { () -> Int in
      Self.currentCellularGeneration().rawValue
    }
  }

  // MARK: - internals

  // Keep this enum in sync with JavaScript
  // Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
  // (https://wicg.github.io/netinfo/).
  enum CellularGeneration: Int {
    case unknown = 0
    case cellular2G = 1
    case cellular3G = 2
    case cellular4G = 3
  }

  static func currentCellularGeneration() -> CellularGeneration {
    let radioAccessTechnology = currentRadioAccessTechnology()

    switch radioAccessTechnology {
    case CTRadioAccessTechnologyGPRS,
         CTRadioAccessTechnologyEdge,
         CTRadioAccessTechnologyCDMA1x:
      return .cellular2G
    case CTRadioAccessTechnologyWCDMA,
         CTRadioAccessTechnologyHSDPA,
         CTRadioAccessTechnologyHSUPA,
         CTRadioAccessTechnologyCDMAEVDORev0,
         CTRadioAccessTechnologyCDMAEVDORevA,
         CTRadioAccessTechnologyCDMAEVDORevB,
         CTRadioAccessTechnologyeHRPD:
      return .cellular3G
    case CTRadioAccessTechnologyLTE:
      return .cellular4G
    default:
      return .unknown
    }
  }

  static func currentRadioAccessTechnology() -> String? {
    let netinfo = CTTelephonyNetworkInfo()

    if #available(iOS 12.0, *) {
      return netinfo.serviceCurrentRadioAccessTechnology?.values.first
    } else {
      return netinfo.currentRadioAccessTechnology
    }
  }

  static func currentCarrier() -> CTCarrier? {
    let netinfo = CTTelephonyNetworkInfo()

    if #available(iOS 12.0, *), let providers = netinfo.serviceSubscriberCellularProviders {
      for carrier in providers.values {
        if carrier.carrierName != nil {
          return carrier
        }
      }
      return providers.values.first
    }
    return netinfo.subscriberCellularProvider
  }
}
