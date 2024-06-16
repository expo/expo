package expo.modules.kotlin.exception

import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.interfaces.permissions.Permissions
import kotlin.reflect.KClass

/**
 * A group of the most common exceptions that might be necessary for modules.
 */
class Exceptions {
  /**
   * An exception to throw when the view with the given tag and class cannot be found.
   */
  class ViewNotFound(
    viewType: KClass<*>,
    viewTag: Int
  ) : CodedException(message = "Unable to find the $viewType view with tag $viewTag")

  /**
   * The app context is no longer available.
   */
  class AppContextLost : CodedException(message = "The app context has been lost")

  /**
   * The react app context is no longer available.
   */
  class ReactContextLost : CodedException(message = "The react context has been lost")

  /**
   * An exception to throw when the native module was missing.
   */
  open class ModuleNotFound(clazz: KClass<*>) : CodedException(message = "$clazz module not found, make sure that everything is linked correctly")

  /**
   * An exception to throw when there is no module implementing the [expo.modules.interfaces.permissions.Permissions] interface.
   */
  class PermissionsModuleNotFound : ModuleNotFound(Permissions::class)

  /**
   * An exception to throw when there is no module implementing the [expo.modules.interfaces.filesystem.FilePermissionModuleInterface] interface.
   */
  class FileSystemModuleNotFound : ModuleNotFound(FilePermissionModuleInterface::class)

  /**
   * An exception to throw when the operation is not supported on the simulator.
   */
  class SimulatorNotSupported : CodedException(message = "This operation is not supported on the simulator")

  /**
   * An exception to throw when Android permissions haven't been granted.
   */
  class MissingPermissions(vararg permissions: String) : CodedException(message = "Missing permissions: ${permissions.joinToString(separator = ", ")}")

  /**
   * An exception to throw when the current Android activity is not longer available.
   */
  class MissingActivity : CodedException(message = "The current activity is no longer available")

  /**
   * An exception to throw when function was called on the incorrect thread.
   */
  class IncorrectThreadException(
    currentThreadName: String,
    expectedThreadName: String
  ) : CodedException(
    message = "Expected to run on $expectedThreadName thread, but was run on $currentThreadName"
  )

  /**
   * An exception to throw when the root view is missing.
   */
  class MissingRootView : CodedException(message = "The root view is missing")
}
