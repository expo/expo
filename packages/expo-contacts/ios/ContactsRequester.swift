import ExpoModulesCore
import Contacts

class ContactsPermissionRequester: NSObject, EXPermissionsRequester {
  static func permissionType() -> String {
    "contacts"
  }

  func getPermissions() -> [AnyHashable: Any] {
    var status: EXPermissionStatus
    let permissions = CNContactStore.authorizationStatus(for: .contacts)

    switch permissions {
    case .authorized:
      status = EXPermissionStatusGranted
    #if compiler(>=6)
    case .limited:
      status = EXPermissionStatusGranted
    #endif
    case .denied, .restricted:
      status = EXPermissionStatusDenied
    case .notDetermined:
      status = EXPermissionStatusUndetermined
    @unknown default:
      status = EXPermissionStatusUndetermined
    }

    return [
      "status": status.rawValue
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
