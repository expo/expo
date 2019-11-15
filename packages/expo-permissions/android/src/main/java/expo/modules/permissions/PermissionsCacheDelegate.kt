package expo.modules.permissions

interface PermissionsCacheDelegate {

  fun contains(permission: String): Boolean

  fun add(permissions: List<String>)
}
