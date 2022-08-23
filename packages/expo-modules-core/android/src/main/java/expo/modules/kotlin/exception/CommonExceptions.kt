package expo.modules.kotlin.exception

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
   * The react app context is no longer available.
   */
  class ReactContextLost : CodedException(message = "The react context has been lost")

  /**
   * An exception to throw when there is no module implementing the [expo.modules.interfaces.permissions.Permissions] interface.
   */
  class PermissionsModuleNotFound : CodedException(message = "Permissions module not found")

  /**
   * An exception to throw when the operation is not supported on the simulator.
   */
  class SimulatorNotSupported : CodedException(message = "This operation is not supported on the simulator")

  /**
   * An exception to throw when there is no module implementing the [expo.modules.interfaces.filesystem.FilePermissionModuleInterface] interface.
   */
  class FileSystemModuleNotFound : CodedException(message = "FileSystem module not found, make sure 'expo-file-system' is linked correctly")

  /**
   * An exception to throw when Android permissions haven't been granted.
   */
  class MissingPermissions(vararg permissions: String) : CodedException(message = "Missing permissions: ${permissions.joinToString(separator = ", ")}")
}
