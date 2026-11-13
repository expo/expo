package expo.modules.v2

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.services.FilePermissionService
import io.github.expo.modules.v2.ExpoObject
import io.github.expo.modules.v2.react.ReactExpoContext
import io.github.expo.modules.v2.react.androidContext
import java.io.File
import java.lang.ref.WeakReference

/**
 * The context of the Expo Modules v2 modules that run next to an [AppContext]. It gives them the
 * directories and the file permission service of that [AppContext], which Expo Go scopes to one
 * experience. When the [AppContext] is gone, every value throws, because a fallback would give the
 * values of Expo Go itself, not those of the experience.
 *
 * The values are read on every access, because Expo Go registers its services after the
 * [AppContext] is created.
 */
class ExpoModulesV2Context(
  reactContext: ReactApplicationContext,
  private val appContext: WeakReference<AppContext>
) : ReactExpoContext(reactContext) {
  val cacheDirectory: File
    get() = requireAppContext().cacheDirectory

  val filesDirectory: File
    get() = requireAppContext().persistentFilesDirectory

  val filePermission: FilePermissionService
    get() = requireAppContext().filePermission

  private fun requireAppContext(): AppContext =
    appContext.get() ?: throw Exceptions.AppContextLost()
}

/**
 * The [ExpoModulesV2Context] of this object, or null when the object belongs to a plain
 * [ReactExpoContext], which has no [AppContext]. Throws when the object has no open context.
 */
private val ExpoObject.appContextScope: ExpoModulesV2Context?
  get() = when (val context = contextOrNull) {
    null -> throw Exceptions.AppContextLost()
    is ExpoModulesV2Context -> context
    else -> null
  }

/**
 * A directory for temporary files that the system can remove at any time. In Expo Go, it belongs
 * to the running experience.
 */
val ExpoObject.cacheDirectory: File
  get() = appContextScope?.cacheDirectory ?: androidContext.cacheDir

/**
 * A directory for user documents and other permanent files. In Expo Go, it belongs to the running
 * experience.
 */
val ExpoObject.filesDirectory: File
  get() = appContextScope?.filesDirectory ?: androidContext.filesDir

/**
 * Tells which paths the module can read and write. In Expo Go, it refuses paths of Expo Go and of
 * other experiences.
 */
val ExpoObject.filePermission: FilePermissionService
  get() = appContextScope?.filePermission ?: FilePermissionService()
