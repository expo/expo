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

  /**
   * The Android context for app storage, like shared preferences. Expo Go gives a context scoped to
   * the running experience.
   */
  open val storageContext: Context
    get() = context

  open val cacheDirectory: File
    get() = context.cacheDir

  open val persistentFilesDirectory: File
    get() = context.filesDir
}
