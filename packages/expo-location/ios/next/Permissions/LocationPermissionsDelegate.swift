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
    requestWithFullAccuracyIfNeeded(ForegroundPermissionsRequester.self, options: options, promise)
  }

  func getBackgroundPermissions(_ promise: Promise) {
    appContext?.permissions?.getPermissionUsingRequesterClass(
      BackgroundPermissionsRequester.self,
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  func requestBackgroundPermissions(options: PermissionsRequestOptions, _ promise: Promise) {
    requestWithFullAccuracyIfNeeded(BackgroundPermissionsRequester.self, options: options, promise)
  }

  private func requestWithFullAccuracyIfNeeded(
    _ requester: EXPermissionsRequester.Type,
    options: PermissionsRequestOptions,
    _ promise: Promise
  ) {
    do {
      guard let permissions = appContext?.permissions else {
        throw PermissionsModuleUnavailable()
      }
      let purposeKey = try fullAccuracyPurposeKey(for: options)

      permissions.askForPermission(
        usingRequesterClass: requester,
        resolve: { result in
          guard let purposeKey else {
            promise.resolve(result)
            return
          }
          self.requestFullAccuracy(purposeKey: purposeKey, for: requester, using: permissions, promise)
        },
        reject: promise.legacyRejecter
      )
    } catch {
      promise.reject(error)
    }
  }

  private func requestFullAccuracy(
    purposeKey: String,
    for requester: EXPermissionsRequester.Type,
    using permissions: EXPermissionsInterface,
    _ promise: Promise
  ) {
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
