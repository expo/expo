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

  func getForegroundPermissions(_ promise: Promise) {
    appContext?.permissions?.getPermissionUsingRequesterClass(
      ForegroundPermissionsRequester.self,
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  func requestForegroundPermissions(options: PermissionsRequestOptions, _ promise: Promise) {
    request(ForegroundPermissionsRequester.self, options: options, promise)
  }

  func getBackgroundPermissions(_ promise: Promise) {
    appContext?.permissions?.getPermissionUsingRequesterClass(
      BackgroundPermissionsRequester.self,
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  func requestBackgroundPermissions(options: PermissionsRequestOptions, _ promise: Promise) {
    request(BackgroundPermissionsRequester.self, options: options, promise)
  }

  private func request(_ requester: EXPermissionsRequester.Type, options: PermissionsRequestOptions, _ promise: Promise) {
    guard let permissions = appContext?.permissions else {
      promise.reject(PermissionsModuleUnavailable())
      return
    }
    let purposeKey: String?
    do {
      purposeKey = try fullAccuracyPurposeKey(for: options)
    } catch {
      promise.reject(error)
      return
    }

    permissions.askForPermission(
      usingRequesterClass: requester,
      resolve: { result in
        guard let purposeKey else {
          promise.resolve(result)
          return
        }
        Task { @MainActor in
          do {
            try await TemporaryFullAccuracyRequester().raiseIfReduced(purposeKey: purposeKey)
            permissions.getPermissionUsingRequesterClass(
              requester,
              resolve: promise.legacyResolver,
              reject: promise.legacyRejecter
            )
          } catch {
            promise.reject(error)
          }
        }
      },
      reject: promise.legacyRejecter
    )
  }

  private func fullAccuracyPurposeKey(for options: PermissionsRequestOptions) throws -> String? {
    guard options.accuracy == .full else {
      return nil
    }
    if let purposeKey = options.fullAccuracyPurposeKey {
      guard TemporaryFullAccuracyPlistKeys.containsPurposeKey(purposeKey) else {
        throw MissingPurposeKeyException(purposeKey)
      }
      return purposeKey
    }
    let defaultKey = TemporaryFullAccuracyPlistKeys.purposeKey
    return TemporaryFullAccuracyPlistKeys.containsPurposeKey(defaultKey) ? defaultKey : nil
  }
}
