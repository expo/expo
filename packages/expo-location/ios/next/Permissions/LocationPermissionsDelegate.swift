import ExpoModulesCore

final class LocationPermissionsDelegate {
  private weak var appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func registerRequesters() {
    EXPermissionsMethodsDelegate.register(
      [
        ForegroundPermissionsRequester(),
        BackgroundPermissionsRequester()
      ],
      withPermissionsManager: appContext?.permissions
    )
  }

  func getForegroundPermissions(_ promise: Promise) throws {
    try getPermissions(.foreground, promise)
  }

  func getBackgroundPermissions(_ promise: Promise) throws {
    try getPermissions(.background, promise)
  }

  func requestForegroundPermissions(options: PermissionsRequestOptions, _ promise: Promise) throws {
    try requestAndRaiseAccuracyIfNeeded(.foreground, options: options, promise)
  }

  func requestBackgroundPermissions(options: PermissionsRequestOptions, _ promise: Promise) throws {
    try requestAndRaiseAccuracyIfNeeded(.background, options: options, promise)
  }

  private func getPermissions(_ kind: PermissionKind, _ promise: Promise) throws {
    guard let permissions = appContext?.permissions else {
      throw PermissionsModuleUnavailable()
    }
    permissions.getPermissionUsingRequesterClass(
      kind.requesterClass,
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  private func requestAndRaiseAccuracyIfNeeded(
    _ kind: PermissionKind,
    options: PermissionsRequestOptions,
    _ promise: Promise
  ) throws {
    guard let permissions = appContext?.permissions else {
      throw PermissionsModuleUnavailable()
    }
    let purposeKey = fullAccuracyPurposeKey(for: options)

    permissions.askForPermission(
      usingRequesterClass: kind.requesterClass,
      resolve: { result in
        guard let purposeKey else {
          promise.resolve(result)
          return
        }
        Task { @MainActor in
          await TemporaryFullAccuracyRequester().raiseIfReduced(purposeKey: purposeKey)
          permissions.getPermissionUsingRequesterClass(
            kind.requesterClass,
            resolve: promise.legacyResolver,
            reject: promise.legacyRejecter
          )
        }
      },
      reject: promise.legacyRejecter
    )
  }

  private func fullAccuracyPurposeKey(for options: PermissionsRequestOptions) -> String? {
    let purposeKey = TemporaryFullAccuracyPlistKeys.purposeKey
    guard options.accuracy == .full, TemporaryFullAccuracyPlistKeys.containsPurposeKey(purposeKey) else {
      return nil
    }
    return purposeKey
  }

  private enum PermissionKind {
    case foreground
    case background

    var requesterClass: EXPermissionsRequester.Type {
      switch self {
      case .foreground:
        return ForegroundPermissionsRequester.self
      case .background:
        return BackgroundPermissionsRequester.self
      }
    }
  }
}
