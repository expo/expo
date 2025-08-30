import CoreTelephony
import ExpoModulesCore

public class CellularModule: Module {
  let carrier = currentCarrier()

  public func definition() -> ModuleDefinition {
    Name("ExpoCellular")

    Constant("allowsVoip") {
      carrier?.allowsVOIP
    }

    Constant("carrier") {
      carrier?.carrierName
    }

    Constant("isoCountryCode") {
      carrier?.isoCountryCode
    }

    Constant("mobileCountryCode") {
      carrier?.mobileCountryCode
    }

    Constant("mobileNetworkCode") {
      carrier?.mobileNetworkCode
    }

    Constant("generation") {
      Self.currentCellularGeneration().rawValue
    }

    AsyncFunction("getCellularGenerationAsync") { () -> Int in
      Self.currentCellularGeneration().rawValue
    }

    AsyncFunction("allowsVoipAsync") { () -> Bool? in
      Self.currentCarrier()?.allowsVOIP
    }

    AsyncFunction("getIsoCountryCodeAsync") { () -> String? in
      Self.currentCarrier()?.isoCountryCode
    }

    AsyncFunction("getCarrierNameAsync") { () -> String? in
      Self.currentCarrier()?.carrierName
    }

    AsyncFunction("getMobileCountryCodeAsync") { () -> String? in
      Self.currentCarrier()?.mobileCountryCode
    }

    AsyncFunction("getMobileNetworkCodeAsync") { () -> String? in
      Self.currentCarrier()?.mobileNetworkCode
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
    case cellular5G = 4
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
      if #available(iOS 14.1, *) {
        if radioAccessTechnology == CTRadioAccessTechnologyNRNSA ||
            radioAccessTechnology == CTRadioAccessTechnologyNR {
          return .cellular5G
        }
      }
      return .unknown
    }
  }

  static func currentRadioAccessTechnology() -> String? {
    let netinfo = CTTelephonyNetworkInfo()
    return netinfo.serviceCurrentRadioAccessTechnology?.values.first
  }

  static func currentCarrier() -> CTCarrier? {
    let netinfo = CTTelephonyNetworkInfo()

    if let providers = netinfo.serviceSubscriberCellularProviders {
      for carrier in providers.values where carrier.carrierName != nil {
        return carrier
      }
      return providers.values.first
    }
    return nil
  }
}
