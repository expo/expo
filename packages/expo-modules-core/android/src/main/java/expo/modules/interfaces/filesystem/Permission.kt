package expo.modules.interfaces.filesystem

import expo.modules.kotlin.services.FilePermissionService

@Deprecated("Use FilePermissionService.Permission instead", ReplaceWith("FilePermissionService.Permission"))
typealias Permission = FilePermissionService.Permission
