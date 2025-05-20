// Copyright 2023-present 650 Industries. All rights reserved.

public final class PermissionRegistry {
  var permissionDefinitions: [String: AnyPermissionDefinition] = [:]

  // MARK: - Accessing

  func getPermission(name: String) -> AnyPermissionDefinition? {
    return permissionDefinitions[name]
  }

  func register(permission: AnyPermissionDefinition) {
    permissionDefinitions[permission.name] = permission
  }

  internal func clear() {
    permissionDefinitions.removeAll()
  }
}
