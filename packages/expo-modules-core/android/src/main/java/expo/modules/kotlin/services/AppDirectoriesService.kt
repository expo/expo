package expo.modules.kotlin.services

import android.content.Context
import java.io.File
import java.lang.ref.WeakReference

open class AppDirectoriesService(
  private val contextHolder: WeakReference<Context>
) {
  private val context
    get() = requireNotNull(contextHolder.get())

  open val cacheDirectory: File
    get() = context.cacheDir

  open val persistentFilesDirectory: File
    get() = context.filesDir
}
