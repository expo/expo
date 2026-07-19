import ExpoModulesCore
import Contacts

class ContactsPermissionRequester: NSObject, EXPermissionsRequester {
  static func permissionType() -> String {
    "contacts"
  }

  func getPermissions() -> [AnyHashable: Any] {
    var status: EXPermissionStatus
    var scope: String
    let permissions = CNContactStore.authorizationStatus(for: .contacts)

    switch permissions {
    case .authorized:
      status = EXPermissionStatusGranted
      scope = "all"
    #if compiler(>=6)
    case .limited:
      status = EXPermissionStatusGranted
      scope = "limited"
    #endif
    case .denied, .restricted:
      status = EXPermissionStatusDenied
      scope = "none"
    case .notDetermined:
      status = EXPermissionStatusUndetermined
      scope = "none"
    @unknown default:
      status = EXPermissionStatusUndetermined
      scope = "none"
    }

    return [
      "status": status.rawValue,
      "accessPrivileges": scope
    ]
  }

  func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    let store = CNContactStore()
    store.requestAccess(for: .contacts) { [weak self] _, _ in
      guard let self else {
        return
      }

      resolve(self.getPermissions())
    }
  }
}
