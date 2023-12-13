import ExpoModulesCore
import StoreKit

public class StoreReviewModule: Module {
  let plist = StoreReviewModule.readProvisioningProfilePlist()

  public func definition() -> ModuleDefinition {
    Name("ExpoStoreReview")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      return !isRunningFromTestFlight()
    }

    AsyncFunction("requestReview") {
      if #available(iOS 15, *) {
        guard let currentScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
          throw MissingCurrentWindowSceneException()
        }

        SKStoreReviewController.requestReview(in: currentScene)
      } else {
        SKStoreReviewController.requestReview()
      }
    }.runOnQueue(DispatchQueue.main)
  }

  private func isRunningFromTestFlight() -> Bool {
    let isSandbox = Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"

    if Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") == nil {
      #if targetEnvironment(simulator)
      return false
      #else
      return isSandbox
      #endif
    }

    guard let mobileProvision = plist else {
      return false
    }

    if let provisionsAllDevices = mobileProvision["ProvisionsAllDevices"] as? Bool, provisionsAllDevices {
      return false
    }

    if let provisionedDevices = mobileProvision["ProvisionedDevices"] as? [String], !provisionedDevices.isEmpty {
      return false
    }

    return isSandbox
  }

  private static func readProvisioningProfilePlist() -> [String: Any]? {
    guard let profilePath = Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") else {
      return nil
    }

    do {
      let profileString = try String(contentsOfFile: profilePath, encoding: .ascii)
      guard let plistStart = profileString.range(of: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"),
        let plistEnd = profileString.range(of: "</plist>") else {
        return nil
      }

      let plistString = String(profileString[plistStart.lowerBound..<plistEnd.upperBound])
      if let plistData = plistString.data(using: .utf8) {
        return try PropertyListSerialization.propertyList(from: plistData, options: [], format: nil) as? [String: Any]
      }
      log.error("Failed to convert plistString to UTF-8 encoded data object.")
      return nil
    } catch {
      log.error("Error reading provisioning profile: \(error.localizedDescription)")
      return nil
    }
  }
}
