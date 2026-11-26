import AdSupport
import ExpoModulesCore

@ExpoModule("ExpoTrackingTransparency")
public class TrackingTransparencyModule: Module {
  public override func didCreate() {
    EXPermissionsMethodsDelegate.register(
      [TrackingTransparencyPermissionRequester()],
      withPermissionsManager: appContext?.permissions
    )
  }

  @JS(.withAsync("getAdvertisingIdAsync"))
  func getAdvertisingId() -> String {
    return ASIdentifierManager.shared().advertisingIdentifier.uuidString
  }

  @JS
  @MainActor
  func getPermissionsAsync() async throws -> [String: Any] {
    return try await withPermissionsContinuation { resolve, reject in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        appContext?.permissions,
        withRequester: TrackingTransparencyPermissionRequester.self,
        resolve: resolve,
        reject: reject
      )
    }
  }

  @JS
  @MainActor
  func requestPermissionsAsync() async throws -> [String: Any] {
    return try await withPermissionsContinuation { resolve, reject in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: appContext?.permissions,
        withRequester: TrackingTransparencyPermissionRequester.self,
        resolve: resolve,
        reject: reject
      )
    }
  }

  @MainActor
  private func withPermissionsContinuation(
    _ body: (@escaping EXPromiseResolveBlock, @escaping EXPromiseRejectBlock) -> Void
  ) async throws -> [String: Any] {
    return try await withCheckedThrowingContinuation { continuation in
      let resolve: EXPromiseResolveBlock = { result in
        continuation.resume(returning: result as? [String: Any] ?? [:])
      }
      let reject: EXPromiseRejectBlock = { code, message, _ in
        continuation.resume(throwing: Exception(name: code ?? "", description: message ?? "", code: code ?? ""))
      }
      body(resolve, reject)
    }
  }
}
