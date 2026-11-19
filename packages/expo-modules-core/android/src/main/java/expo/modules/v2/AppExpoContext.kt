package expo.modules.v2

import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import io.github.expo.modules.v2.ExpoObject
import io.github.expo.modules.v2.react.ReactExpoContext
import java.lang.ref.WeakReference

internal class AppExpoContext(
  appContext: AppContext,
  reactContext: ReactApplicationContext
) : ReactExpoContext(reactContext) {
  private val appContextHolder = WeakReference(appContext)

  val appContext: AppContext?
    get() = appContextHolder.get()
}

/**
 * The [AppContext] of the app this module or shared object belongs to. Throws when the object has
 * no context yet, when that context is closed, or when it was not created by `expo-modules-core`.
 */
val ExpoObject.legacyAppContext: AppContext
  get() {
    val context = context
    check(context is AppExpoContext) {
      "${javaClass.name} belongs to a ${context.javaClass.name}, which has no AppContext"
    }
    return context.appContext ?: throw Exceptions.AppContextLost()
  }

/** Like [legacyAppContext], but null instead of throwing. */
val ExpoObject.legacyAppContextOrNull: AppContext?
  get() = (contextOrNull as? AppExpoContext)?.appContext
