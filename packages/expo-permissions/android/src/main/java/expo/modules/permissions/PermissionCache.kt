package expo.modules.permissions

interface PermissionCache {

  fun contains(permission: String): Boolean

  fun add(permissions: List<String>)
}
