package expo.modules.filesystem

import android.content.Context
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.filesystem.Permission
import expo.modules.interfaces.filesystem.ScopedDirectories
import expo.modules.interfaces.filesystem.ScopedDirectoriesModuleInterface
import java.io.File
import java.io.IOException
import java.util.*

/*
New Sweet API modules don't have an easy way to access scoped context. We can't initialize them with scoped context as they need a ReactApplicationContext instead.
We can't make ScopedContext inherit from ReactApplicationContext as that would require moving ScopedContext to versioned and a large refactor.

This module is a stopgap solution to provide modules with a way to access ScopedContext directories using the filesystem module, only for our internal modules.
 */

// The class needs to be 'open', because it's inherited in expoview
open class ScopedDirectoriesModule(private val context: Context) : ScopedDirectoriesModuleInterface, InternalModule {

  override fun getExportedInterfaces(): List<Class<*>> =
    listOf(ScopedDirectoriesModuleInterface::class.java)

  override fun getScopedDirectories(): ScopedDirectories {
    return ScopedDirectories(context.cacheDir, context.filesDir)
  }

}
