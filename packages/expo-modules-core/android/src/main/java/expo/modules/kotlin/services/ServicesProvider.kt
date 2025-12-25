package expo.modules.kotlin.services

import android.content.Context
import expo.modules.kotlin.weak

open class ServicesProvider(
  context: Context
) {
  internal val contextHolder = context.weak()

  open fun filePermission(): FilePermissionService {
    return FilePermissionService()
  }

  open fun appDirectories(): AppDirectoriesService {
    return AppDirectoriesService(contextHolder)
  }
}
