import ExpoModulesCore

final class MediaLibraryNextPermissionDelegate {
  private weak var appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func registerPermissionRequesters() {
    appContext?.permissions?.register([
      MediaLibraryPermissionRequester(),
      MediaLibraryWriteOnlyPermissionRequester()
    ])
  }

  func getPermissions(writeOnly: Bool, promise: Promise) throws {
    let permissionsManager = try permissionsManager()
    permissionsManager.getPermissionUsingRequesterClass(
      requesterClass(writeOnly),
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  func requestPermissions(writeOnly: Bool, promise: Promise) throws {
    let permissionsManager = try permissionsManager()
    permissionsManager.askForPermission(
      usingRequesterClass: requesterClass(writeOnly),
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  func checkIfReadWritePermissionGranted() async throws {
    let permissions = try await getPermissions(using: MediaLibraryPermissionRequester.self)
    guard hasGrantedPermission(permissions) else {
      throw FailedToGrantPermissions()
    }
  }

  func checkIfWritePermissionGranted() async throws {
    let writeOnlyPermissions = try await getPermissions(using: MediaLibraryWriteOnlyPermissionRequester.self)
    if hasGrantedPermission(writeOnlyPermissions) {
      return
    }

    let readWritePermissions = try await getPermissions(using: MediaLibraryPermissionRequester.self)
    guard hasWritePermission(
      writeOnlyPermissions: writeOnlyPermissions,
      readWritePermissions: readWritePermissions
    ) else {
      throw FailedToGrantPermissions()
    }
  }

  func checkIfFullAccessGranted() async throws {
    let permissions = try await getPermissions(using: MediaLibraryPermissionRequester.self)
    guard hasFullAccess(permissions) else {
      throw FailedToGrantPermissions()
    }
  }

  private func getPermissions(using requesterClass: EXPermissionsRequester.Type) async throws -> [String: Any] {
    let permissionsManager = try permissionsManager()

    return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[String: Any], Error>) in
      permissionsManager.getPermissionUsingRequesterClass(
        requesterClass,
        resolve: { result in
          guard let permissions = result as? [String: Any] else {
            continuation.resume(throwing: FailedToGrantPermissions())
            return
          }

          continuation.resume(returning: permissions)
        },
        reject: { _, _, error in
          continuation.resume(throwing: error ?? FailedToGrantPermissions())
        }
      )
    }
  }

  private func permissionsManager() throws -> EXPermissionsInterface {
    guard let permissionsManager = appContext?.permissions else {
      throw FailedToGrantPermissions()
    }
    return permissionsManager
  }

  private func hasGrantedPermission(_ permissions: [String: Any]) -> Bool {
    permissions["status"] as? String == "granted"
  }

  private func hasFullAccess(_ permissions: [String: Any]) -> Bool {
    hasGrantedPermission(permissions) && permissions["accessPrivileges"] as? String == "all"
  }

  private func hasWritePermission(
    writeOnlyPermissions: [String: Any],
    readWritePermissions: [String: Any]
  ) -> Bool {
    hasGrantedPermission(writeOnlyPermissions) || hasGrantedPermission(readWritePermissions)
  }
}
