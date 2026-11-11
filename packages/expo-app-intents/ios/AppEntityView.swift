import AppIntents
import ExpoModulesCore

#if canImport(UIKit)
import UIKit

internal final class AppEntityView: ExpoView {
  private var needsIdentifierUpdate = false
  var entity: String = "" {
    didSet { needsIdentifierUpdate = true }
  }
  var entityId: String = "" {
    didSet { needsIdentifierUpdate = true }
  }
  private var diagnosticsLogger: Logger {
    return appContext?.jsLogger ?? log
  }

  func updateAppEntityIdentifierIfNeeded() {
    guard needsIdentifierUpdate else {
      return
    }
    needsIdentifierUpdate = false

    #if compiler(>=6.4)
    guard #available(iOS 18.4, tvOS 18.4, *) else {
      AppEntityIdentifierDiagnostics.reportUnavailableOSVersion(to: diagnosticsLogger)
      return
    }

    guard let identifier = AppEntityIdentifierRegistry.shared.identifier(for: entity, id: entityId) else {
      appEntityIdentifier = nil
      AppEntityIdentifierDiagnostics.reportUnregisteredEntity(entity, to: diagnosticsLogger)
      return
    }

    appEntityIdentifier = identifier
    #else
    AppEntityIdentifierDiagnostics.reportUnavailableCompilerVersion(to: diagnosticsLogger)
    #endif
  }
}
#endif
