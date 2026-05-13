package expo.modules.kotlin.services

import android.content.Context
import expo.modules.kotlin.weak
import java.io.File
import java.lang.ref.WeakReference

open class AppDirectoriesService(
  context: Context
) : Service {
  private val contextHolder: WeakReference<Context> = context.weak()

  private val context
    get() = requireNotNull(contextHolder.get())

  open val cacheDirectory: File
    get() = context.cacheDir

  open val persistentFilesDirectory: File
    get() = context.filesDir
}
